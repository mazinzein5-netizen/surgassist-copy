import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const caseId = body.case_id;

    if (!caseId) {
      return Response.json({ error: 'case_id is required' }, { status: 400 });
    }

    // 1. Fetch the case file
    const caseData = await base44.asServiceRole.entities.CaseFile.get(caseId);
    if (!caseData) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    // 2. Fetch recent ChatMessages for the case
    const messages = await base44.asServiceRole.entities.ChatMessage.filter(
      { case_id: caseId },
      '-created_date',
      50
    );

    // 3. Fetch recent LabResults for the case
    const labs = await base44.asServiceRole.entities.LabResult.filter(
      { case_id: caseId },
      '-collected_at',
      50
    );

    // 4. Fetch Patient record for email address
    let patientEmail = null;
    if (caseData.patient_id) {
      try {
        const patient = await base44.asServiceRole.entities.Patient.get(caseData.patient_id);
        patientEmail = patient?.patient_email || null;
      } catch {}
    }

    // 5. Compile discharge summary using LLM (Clip's logic)
    const chatText = messages
      .map((m) => `${m.role === 'assistant' ? 'AI' : 'Referrer'}: ${m.content}`)
      .join('\n');

    const labsText = labs
      .map((l) => `${l.test_type}: ${l.value} ${l.unit || ''} (collected ${l.collected_at ? new Date(l.collected_at).toLocaleDateString('en-IE') : 'N/A'})`)
      .join('\n');

    const kardexMeds = caseData.kardex_data?.medications
      ? caseData.kardex_data.medications.map((m) => `${m.drug} ${m.dose} ${m.route} ${m.frequency} — ${m.indication || ''}`).join('\n')
      : 'No medication data available';

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are Clip, the HIVE Surgical Assistant's clinical coordinator. Compile a professional discharge summary report for the following patient.

PATIENT: ${caseData.patient_name}
MRN: ${caseData.patient_mrn || 'N/A'}
Department: ${caseData.department}
Presenting Complaint: ${caseData.presenting_complaint || 'N/A'}
Admission Note: ${caseData.admission_note || 'N/A'}
Treatment Plan: ${caseData.treatment_plan || 'N/A'}

INPATIENT MEDICATIONS:
${kardexMeds}

REFERRAL CONVERSATION (recent ChatMessages):
${chatText || 'No messages available'}

RECENT LAB RESULTS:
${labsText || 'No lab results available'}

Please compile a clear, professional discharge summary with these sections:
1. Admission Summary — brief overview of presentation and admission
2. Key Findings & Investigations — summary of lab results and clinical findings
3. Treatment Received — what was done during admission
4. Discharge Medications — current medication list
5. Follow-Up Plan — any follow-up appointments or actions needed
6. Safety Netting Advice — warning signs and when to seek help

Format as a clean clinical report suitable for the patient.`,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: 'Full discharge summary report' }
        }
      }
    });

    const summary = llmResponse.summary || 'Unable to compile summary.';

    // 6. Email the final report to the patient
    let emailSent = false;
    if (patientEmail) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: patientEmail,
          subject: `Discharge Summary — ${caseData.patient_name}`,
          body: summary
        });
        emailSent = true;
      } catch (e) {
        console.error('Email failed:', e.message);
      }
    }

    // 7. Archive TheatreLog records for this patient
    let archivedCount = 0;
    try {
      const theatreLogs = await base44.asServiceRole.entities.TheatreLog.filter({
        patient_name: caseData.patient_name
      });
      for (const log of theatreLogs) {
        await base44.asServiceRole.entities.TheatreLog.update(log.id, { archived: true });
        archivedCount++;
      }
    } catch (e) {
      console.error('TheatreLog archive failed:', e.message);
    }

    return Response.json({
      success: true,
      case_id: caseId,
      patient: caseData.patient_name,
      summary,
      email_sent: emailSent,
      patient_email: patientEmail,
      theatre_logs_archived: archivedCount,
      messages_processed: messages.length,
      labs_processed: labs.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});