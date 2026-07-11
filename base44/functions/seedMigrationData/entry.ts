import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const patients = [
      { name: "Darrol Mcalister", mrn: "9762", dob: "Not provided", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", specialty: "Orthopaedics", ward: null },
      { name: "Jacinta McDonough", mrn: "333760", dob: "1995-01-20", hospital: "Midwestern University Hospital Tullamore", department: "general_surgery", specialty: "General Surgery" },
      { name: "Unknown", mrn: "Unknown", dob: "Unknown", hospital: "Midwestern University Hospital Tullamore", department: "general_surgery", specialty: "General Surgery" },
      { name: "Bary Nolan", mrn: "631378", dob: "1955-01-12", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", ward: "Bora bed 7" },
      { name: "Irene Woulfe", mrn: "27002834", dob: "2008-03-16", hospital: "Midwestern University Hospital Tullamore", department: "general_surgery", specialty: "General Surgery" },
      { name: "Ann Brennan", mrn: "863606", dob: "Not provided", hospital: "Midwestern University Hospital Tullamore", department: "general_surgery", specialty: "General Surgery" },
      { name: "Moloney John Paul", mrn: "124310", dob: "1982-05-19", hospital: "Midwestern University Hospital Tullamore", department: "general_surgery", specialty: "General Surgery" },
      { name: "Marie Lynch", mrn: "19871", dob: "1950-07-22", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", ward: "Arden" },
      { name: "Barbara Ryan", mrn: "63451", dob: "1973-12-13", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", ward: "Bora" },
      { name: "Graham Radford", mrn: "2392325", dob: "Not provided", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", specialty: "Orthopaedics" },
      { name: "Leo Friend", mrn: "750954", dob: "Not provided", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", specialty: "Orthopaedics" },
      { name: "Joseph Fox", mrn: "368665", dob: "Unknown", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", specialty: "Pending evaluation" },
      { name: "Not provided", mrn: "564524", dob: "Not provided", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", specialty: "Orthopaedics" },
      { name: "not_provided", mrn: "not_provided", dob: "not_provided", hospital: "Midwestern University Hospital Tullamore", department: "general_surgery", specialty: "pending_confirmation" },
      { name: "Mary Morrissey", mrn: "Not provided", dob: "Not provided", hospital: "Midwestern University Hospital Tullamore", department: "general_surgery", specialty: "ENT" },
      { name: "Jo Hanlon", mrn: "283832", dob: "1963-07-05", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", ward: "Bora" },
      { name: "John Doe", mrn: "1230228", dob: "2026-07-05", hospital: "Midwestern University Hospital Tullamore", department: "orthopaedics", ward: "Allwn" },
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

    const patientResults = await base44.asServiceRole.entities.Patient.bulkCreate(patients);
    const onCallResults = await base44.asServiceRole.entities.OnCallTeam.create(onCallTeam);
    const staffResults = await base44.asServiceRole.entities.StaffProfile.create(staffProfile);
    const labResults_inserted = await base44.asServiceRole.entities.LabResult.bulkCreate(labResults);

    return Response.json({
      status: "success",
      inserted: {
        patients: patientResults.length || patients.length,
        onCallTeam: 1,
        staffProfile: 1,
        labResults: labResults_inserted.length || labResults.length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});