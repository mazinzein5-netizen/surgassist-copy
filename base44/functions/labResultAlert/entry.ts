import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // --- NOTIFY: send lab result alert to on-call team + case creator ---
    if (body.action === "notify") {
      const caseId = body.case_id;
      if (!caseId) return Response.json({ error: "case_id required" }, { status: 400 });

      const caseFile = await base44.asServiceRole.entities.CaseFile.get(caseId);
      if (!caseFile) return Response.json({ error: "Case not found" }, { status: 404 });

      const lab = body.lab_data || {};
      const testType = lab.test_type || "lab result";
      const valueStr = lab.value != null ? `${lab.value} ${lab.unit || ""}`.trim() : "N/A";
      const source = lab.source === "ocr_ingestion" ? "Scanned document" : "Manual entry";
      const collected = lab.collected_at
        ? new Date(lab.collected_at).toLocaleString("en-IE")
        : "N/A";

      const alertBody = [
        "🧪 NEW LAB RESULT ALERT",
        "",
        `Patient: ${caseFile.patient_name}`,
        `MRN: ${caseFile.patient_mrn || "N/A"}`,
        `Department: ${caseFile.department || "N/A"}`,
        `Ward: ${caseFile.ward || "N/A"}`,
        `Diagnosis: ${caseFile.diagnosis || "Not documented"}`,
        "",
        `Test: ${testType}`,
        `Result: ${valueStr}`,
        `Source: ${source}`,
        `Collected: ${collected}`,
        "",
        "Please review and take action if required.",
      ].join("\n");

      // Find active on-call team for this department
      const teams = await base44.asServiceRole.entities.OnCallTeam.filter(
        { department: caseFile.department, is_active: true },
        "-shift_date",
        5
      );
      const todayStr = new Date().toISOString().split("T")[0];
      const team = teams.find((t) => t.shift_date === todayStr) || teams[0];

      // Get staff profiles for matching on-call names to user accounts
      const staff = await base44.asServiceRole.entities.StaffProfile.filter(
        { department: caseFile.department },
        undefined,
        100
      );

      let messageId = null;
      let recipientName = null;
      let recipientId = null;
      let emailSent = false;

      // Priority: registrar first, then SHO
      const candidates = [
        { name: team?.registrar_name, role: "Registrar" },
        { name: team?.sho_name, role: "SHO" },
      ].filter((c) => c.name);

      for (const candidate of candidates) {
        const match = staff.find((s) => s.full_name === candidate.name);
        if (match && match.user_id) {
          const msg = await base44.asServiceRole.entities.Message.create({
            sender_id: "system",
            sender_name: "HIVE Workflow",
            recipient_id: match.user_id,
            recipient_name: candidate.name,
            body: alertBody,
            attachment_label: `Lab Result Alert — ${caseFile.patient_name} (${testType})`,
            attachment_case_id: caseFile.id,
          });
          messageId = msg.id;
          recipientName = candidate.name;
          recipientId = match.user_id;
          break;
        }
      }

      // Also email the case creator (registered user) for immediate notification
      if (caseFile.created_by_id) {
        try {
          const creator = await base44.asServiceRole.entities.User.get(caseFile.created_by_id);
          if (creator?.email) {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: creator.email,
              subject: `HIVE Lab Alert — ${caseFile.patient_name} (${testType}: ${valueStr})`,
              body: alertBody,
            });
            emailSent = true;
          }
        } catch (e) {
          console.error("Email notification failed:", e.message);
        }
      }

      return Response.json({
        message_id: messageId,
        recipient_id: recipientId,
        recipient_name: recipientName,
        email_sent: emailSent,
        case_id: caseFile.id,
        test_type: testType,
        value: valueStr,
      });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});