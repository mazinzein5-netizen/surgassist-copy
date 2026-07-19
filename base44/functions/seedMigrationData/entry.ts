import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    const patients = [
      { name: "Demo Patient 01", mrn: "100001", dob: "1955-03-15", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", specialty: "Orthopaedics", ward: null },
      { name: "Demo Patient 02", mrn: "100002", dob: "1990-06-22", hospital: "Midwestern University Hospital Tullamore", department: "general_surgery", specialty: "General Surgery" },
      { name: "Demo Patient 03", mrn: "100003", dob: "1948-09-30", hospital: "Midwestern University Hospital Tullamore", department: "general_surgery", specialty: "General Surgery" },
      { name: "Demo Patient 04", mrn: "100004", dob: "1944-02-28", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", ward: "Bora bed 7" },
      { name: "Demo Patient 05", mrn: "100005", dob: "2001-11-08", hospital: "Midwestern University Hospital Tullamore", department: "general_surgery", specialty: "General Surgery" },
      { name: "Demo Patient 06", mrn: "100006", dob: "1965-04-17", hospital: "Midwestern University Hospital Tullamore", department: "general_surgery", specialty: "General Surgery" },
      { name: "Demo Patient 07", mrn: "100007", dob: "1978-12-03", hospital: "Midwestern University Hospital Tullamore", department: "general_surgery", specialty: "General Surgery" },
      { name: "Demo Patient 08", mrn: "100008", dob: "1950-07-22", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", ward: "Arden" },
      { name: "Demo Patient 09", mrn: "100009", dob: "1970-08-19", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", ward: "Bora" },
      { name: "Demo Patient 10", mrn: "100010", dob: "1962-10-25", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", specialty: "Orthopaedics" },
      { name: "Demo Patient 11", mrn: "100011", dob: "1958-01-07", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", specialty: "Orthopaedics" },
      { name: "Demo Patient 12", mrn: "100012", dob: "1975-05-14", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", specialty: "Pending evaluation" },
      { name: "Demo Patient 13", mrn: "100013", dob: "1969-07-21", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", specialty: "Orthopaedics" },
      { name: "Demo Patient 14", mrn: "100014", dob: "1985-09-02", hospital: "Midwestern University Hospital Tullamore", department: "general_surgery", specialty: "pending_confirmation" },
      { name: "Demo Patient 15", mrn: "100015", dob: "1953-11-11", hospital: "Midwestern University Hospital Tullamore", department: "general_surgery", specialty: "ENT" },
      { name: "Demo Patient 16", mrn: "100016", dob: "1960-03-23", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", ward: "Bora" },
      { name: "Demo Patient 17", mrn: "100017", dob: "1988-04-10", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", ward: "Allwn" },
    ];

    const onCallTeam = {
      hospital: "Midwestern University Hospital Tullamore",
      department: "orthopaedics",
      consultant_name: "Umair (Al Hadi)",
      registrar_name: "Adeel",
      sho_name: "Mazin",
      shift_date: "2026-07-05",
      is_active: true,
    };

    const staffProfile = {
      user_id: "migrated",
      full_name: "Mr Zein",
      department: "orthopaedics",
      hospital: "Midwestern University Hospital Tullamore",
      grade: "nchd",
    };

    const labResults = [
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "platelets", value: 378, unit: "x10^9/L", collected_at: "2026-07-01T10:25:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "platelets", value: 420, unit: "x10^9/L", collected_at: "2026-07-02T09:51:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "platelets", value: 453, unit: "x10^9/L", collected_at: "2026-07-03T09:21:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "platelets", value: 477, unit: "x10^9/L", collected_at: "2026-07-05T11:20:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "haemoglobin", value: 8, unit: "g/dL", collected_at: "2026-07-01T10:25:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "haemoglobin", value: 10.7, unit: "g/dL", collected_at: "2026-07-02T09:51:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "haemoglobin", value: 11.0, unit: "g/dL", collected_at: "2026-07-03T09:21:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "haemoglobin", value: 11.4, unit: "g/dL", collected_at: "2026-07-05T11:20:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "wcc", value: 11.83, unit: "x10^9/L", collected_at: "2026-07-01T10:25:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "wcc", value: 10.57, unit: "x10^9/L", collected_at: "2026-07-02T09:51:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "wcc", value: 12.74, unit: "x10^9/L", collected_at: "2026-07-03T09:21:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "wcc", value: 15.92, unit: "x10^9/L", collected_at: "2026-07-05T11:20:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "potassium", value: 100, unit: "mmol/L", collected_at: "2026-07-03T00:00:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "egfr", value: 5.9, unit: "mL/min/1.73m2", collected_at: "2026-07-03T00:00:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "creatinine", value: 133, unit: "umol/L", collected_at: "2026-07-03T00:00:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "urea", value: 81, unit: "mmol/L", collected_at: "2026-07-03T00:00:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "potassium", value: 89, unit: "mmol/L", collected_at: "2026-07-05T00:00:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "creatinine", value: 120, unit: "umol/L", collected_at: "2026-07-05T00:00:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "urea", value: 84, unit: "mmol/L", collected_at: "2026-07-05T00:00:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "potassium", value: 91, unit: "mmol/L", collected_at: "2026-07-06T00:00:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "egfr", value: 4.4, unit: "mL/min/1.73m2", collected_at: "2026-07-06T00:00:00Z", source: "ocr_ingestion" },
      { case_id: "", patient_name: "Barbara Ryan", patient_mrn: "63451", test_type: "creatinine", value: 123, unit: "umol/L", collected_at: "2026-07-06T00:00:00Z", source: "ocr_ingestion" },
    ];

    const caseFiles = [
      { patient_name: "Darrol Mcalister", patient_mrn: "9762", patient_dob: "Not provided", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", specialty: "Orthopaedics", status: "discharged", referral_mode: "camera", referrer_name: "Assad", referrer_grade: "sho", referrer_department: "ED", on_call_consultant: "Umair (Al Hadi)", on_call_registrar: "Adeel", on_call_sho: "Mazin", accepting_specialty: "Orthopaedics", triage_decision: "needs_more_info", presenting_complaint: "Diabetic foot ulcer with necrosis and cellulitis", mechanism_of_injury: "N/A - chronic progression", referral_summary: "70-year-old male with Type 2 DM presenting with necrotic ulceration of the left hallux, associated with spreading cellulitis of the distal leg. Plain films negative for osteomyelitis.", discharge_pathway: "no_followup", review_status: "pending", pre_op_status: "not_listed" },
      { patient_name: "Jacinta McDonough", patient_mrn: "333760", patient_dob: "1995-01-20", hospital: "Midwestern University Hospital Tullamore", department: "general_surgery", specialty: "General Surgery", status: "discharged", referral_mode: "camera", referrer_name: "Niall", referrer_grade: "sho", referrer_department: "ED", on_call_consultant: "Umair (Al Hadi)", on_call_registrar: "Adeel", on_call_sho: "Mazin", triage_decision: "needs_more_info", presenting_complaint: "Postoperative surgical drain management following cosmetic surgery abroad", mechanism_of_injury: "N/A (Surgical procedure)", review_status: "pending", pre_op_status: "not_listed" },
      { patient_name: "Irene Woulfe", patient_mrn: "27002834", patient_dob: "2008-03-16", hospital: "Midwestern University Hospital Tullamore", department: "general_surgery", specialty: "General Surgery", status: "admitted", referral_mode: "camera", referrer_department: "ED", on_call_consultant: "Umair (Al Hadi)", on_call_registrar: "Adeel", on_call_sho: "Mazin", triage_decision: "accept", presenting_complaint: "Acute abdominal pain", review_status: "pending", pre_op_status: "not_listed" },
      { patient_name: "Ann Brennan", patient_mrn: "863606", patient_dob: "Not provided", hospital: "Midwestern University Hospital Tullamore", department: "general_surgery", specialty: "General Surgery", status: "admitted", referral_mode: "camera", referrer_department: "ED", on_call_consultant: "Umair (Al Hadi)", on_call_registrar: "Adeel", on_call_sho: "Mazin", triage_decision: "accept", presenting_complaint: "Abdominal pain query appendicitis", review_status: "pending", pre_op_status: "not_listed" },
      { patient_name: "Moloney John Paul", patient_mrn: "124310", patient_dob: "1982-05-19", hospital: "Midwestern University Hospital Tullamore", department: "general_surgery", specialty: "General Surgery", status: "admitted", referral_mode: "camera", referrer_department: "ED", on_call_consultant: "Umair (Al Hadi)", on_call_registrar: "Adeel", on_call_sho: "Mazin", triage_decision: "accept", presenting_complaint: "Abdominal pain", review_status: "pending", pre_op_status: "not_listed" },
      { patient_name: "Marie Lynch", patient_mrn: "19871", patient_dob: "1950-07-22", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", ward: "Arden", status: "admitted", referral_mode: "audio", on_call_consultant: "Umair (Al Hadi)", on_call_registrar: "Adeel", on_call_sho: "Mazin", triage_decision: "accept", presenting_complaint: "Orthopaedic review", review_status: "pending", pre_op_status: "not_listed" },
      { patient_name: "Barbara Ryan", patient_mrn: "63451", patient_dob: "1973-12-13", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", ward: "Bora", status: "admitted", referral_mode: "audio", on_call_consultant: "Umair (Al Hadi)", on_call_registrar: "Adeel", on_call_sho: "Mazin", triage_decision: "accept", presenting_complaint: "Post-op orthopaedic review", review_status: "pending", pre_op_status: "not_listed" },
      { patient_name: "Graham Radford", patient_mrn: "2392325", patient_dob: "Not provided", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", specialty: "Orthopaedics", status: "admitted", referral_mode: "camera", referrer_department: "ED", on_call_consultant: "Umair (Al Hadi)", on_call_registrar: "Adeel", on_call_sho: "Mazin", triage_decision: "accept", presenting_complaint: "Orthopaedic injury", review_status: "pending", pre_op_status: "not_listed" },
      { patient_name: "Leo Friend", patient_mrn: "750954", patient_dob: "Not provided", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", specialty: "Orthopaedics", status: "admitted", referral_mode: "camera", on_call_consultant: "Umair (Al Hadi)", on_call_registrar: "Adeel", on_call_sho: "Mazin", triage_decision: "accept", presenting_complaint: "Orthopaedic review", review_status: "pending", pre_op_status: "not_listed" },
      { patient_name: "Joseph Fox", patient_mrn: "368665", patient_dob: "Unknown", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", specialty: "Pending evaluation", status: "admitted", referral_mode: "camera", referrer_department: "ED", on_call_consultant: "Umair (Al Hadi)", on_call_registrar: "Adeel", on_call_sho: "Mazin", triage_decision: "needs_more_info", presenting_complaint: "Pending evaluation", review_status: "pending", pre_op_status: "not_listed" },
    ];

    const patientResults = await base44.asServiceRole.entities.Patient.bulkCreate(patients);
    const onCallResults = await base44.asServiceRole.entities.OnCallTeam.create(onCallTeam);
    const staffResults = await base44.asServiceRole.entities.StaffProfile.create(staffProfile);
    const labResults_inserted = await base44.asServiceRole.entities.LabResult.bulkCreate(labResults);
    const caseFileResults = await base44.asServiceRole.entities.CaseFile.bulkCreate(caseFiles);

    return Response.json({
      status: "success",
      inserted: {
        patients: patientResults.length || patients.length,
        onCallTeam: 1,
        staffProfile: 1,
        labResults: labResults_inserted.length || labResults.length,
        caseFiles: caseFileResults.length || caseFiles.length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});