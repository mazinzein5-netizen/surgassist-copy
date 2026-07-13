import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // --- NOTIFY: send alert to on-call team member ---
    if (body.action === "notify") {
      const caseId = body.case_id;
      if (!caseId) return Response.json({ error: "case_id required" }, { status: 400 });

      const caseFile = await base44.asServiceRole.entities.CaseFile.get(caseId);
      if (!caseFile) return Response.json({ error: "Case not found" }, { status: 404 });

      // Find active on-call team for this department
      const teams = await base44.asServiceRole.entities.OnCallTeam.filter(
        { department: caseFile.department, is_active: true },
        "-shift_date",
        5
      );
      const todayStr = new Date().toISOString().split("T")[0];
      const team = teams.find((t) => t.shift_date === todayStr) || teams[0];

      if (!team) return Response.json({ error: "No active on-call team found", case_id: caseId });

      const photo = body.photo_data || {};
      const photoType = photo.photo_type || "clinical photo";
      const caption = photo.caption ? `\nCaption: ${photo.caption}` : "";

      const alertBody = [
        "📸 NEW CLINICAL PHOTO ALERT",
        "",
        `Patient: ${caseFile.patient_name}`,
        `MRN: ${caseFile.patient_mrn || "N/A"}`,
        `Department: ${caseFile.department || "N/A"}`,
        `Diagnosis: ${caseFile.diagnosis || "Not documented"}`,
        `Photo Type: ${photoType}${caption}`,
        "",
        "Please review and acknowledge this alert.",
      ].join("\n");

      // Priority: registrar first, then SHO
      const candidates = [
        { name: team.registrar_name, role: "Registrar" },
        { name: team.sho_name, role: "SHO" },
      ].filter((c) => c.name);

      const staff = await base44.asServiceRole.entities.StaffProfile.filter(
        { department: caseFile.department },
        undefined,
        100
      );

      let messageId = null;
      let recipientName = null;
      let recipientId = null;

      for (const candidate of candidates) {
        const match = staff.find((s) => s.full_name === candidate.name);
        if (match && match.user_id) {
          const msg = await base44.asServiceRole.entities.Message.create({
            sender_id: "system",
            sender_name: "HIVE Workflow",
            recipient_id: match.user_id,
            recipient_name: candidate.name,
            body: alertBody,
            attachment_label: `Clinical Photo Alert — ${caseFile.patient_name}`,
            attachment_case_id: caseFile.id,
          });
          messageId = msg.id;
          recipientName = candidate.name;
          recipientId = match.user_id;
          break;
        }
      }

      if (!messageId) {
        return Response.json({
          error: "No on-call team member with a system account found",
          case_id: caseId,
        });
      }

      return Response.json({
        message_id: messageId,
        recipient_id: recipientId,
        recipient_name: recipientName,
        case_id: caseFile.id,
        department: caseFile.department,
      });
    }

    // --- ESCALATE: check acknowledgment, escalate to consultant if unread ---
    if (body.action === "escalate") {
      const originalMsgId = body.original_message_id;
      if (!originalMsgId) return Response.json({ error: "original_message_id required" }, { status: 400 });

      const originalMsg = await base44.asServiceRole.entities.Message.get(originalMsgId);
      if (!originalMsg) return Response.json({ escalated: false, reason: "Original message not found" });

      if (originalMsg.read) {
        return Response.json({ escalated: false, reason: "acknowledged" });
      }

      const caseId = originalMsg.attachment_case_id;
      const caseFile = await base44.asServiceRole.entities.CaseFile.get(caseId);
      if (!caseFile) return Response.json({ escalated: false, reason: "Case not found" });

      // Find consultant (lead surgeon) from on-call team
      const teams = await base44.asServiceRole.entities.OnCallTeam.filter(
        { department: caseFile.department, is_active: true },
        "-shift_date",
        5
      );
      const todayStr = new Date().toISOString().split("T")[0];
      const team = teams.find((t) => t.shift_date === todayStr) || teams[0];

      if (!team || !team.consultant_name) {
        return Response.json({ escalated: false, reason: "No consultant on on-call team" });
      }

      const staff = await base44.asServiceRole.entities.StaffProfile.filter(
        { department: caseFile.department },
        undefined,
        100
      );
      const consultant = staff.find((s) => s.full_name === team.consultant_name);

      if (!consultant || !consultant.user_id) {
        return Response.json({ escalated: false, reason: "Consultant has no system account" });
      }

      const escalationBody = [
        "🚨 ESCALATION — Unacknowledged Clinical Photo Alert",
        "",
        `Patient: ${caseFile.patient_name}`,
        `MRN: ${caseFile.patient_mrn || "N/A"}`,
        `Department: ${caseFile.department || "N/A"}`,
        `Diagnosis: ${caseFile.diagnosis || "Not documented"}`,
        "",
        `A clinical photo alert was sent to ${originalMsg.recipient_name} 2 hours ago and has NOT been acknowledged.`,
        "",
        "Please review and take action as the lead surgeon.",
      ].join("\n");

      const msg = await base44.asServiceRole.entities.Message.create({
        sender_id: "system",
        sender_name: "HIVE Workflow",
        recipient_id: consultant.user_id,
        recipient_name: team.consultant_name,
        body: escalationBody,
        attachment_label: `ESCALATION — ${caseFile.patient_name}`,
        attachment_case_id: caseFile.id,
      });

      return Response.json({ escalated: true, message_id: msg.id, consultant: team.consultant_name });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});