import { base44 } from "@/api/base44Client";
import {
  TRIAGE_SYSTEM_PROMPT, CLERKING_SYSTEM_PROMPT, KARDEX_SYSTEM_PROMPT,
  DISCHARGE_SYSTEM_PROMPT, CONSENT_SYSTEM_PROMPT, INEWS_SYSTEM_PROMPT,
  DRUG_DOSE_SYSTEM_PROMPT, PRE_CLERKING_SYSTEM_PROMPT, INVESTIGATION_SYSTEM_PROMPT, ADMISSION_NOTE_SYSTEM_PROMPT, COMPLETENESS_CHECK_SYSTEM_PROMPT, INVESTIGATION_SUGGESTION_PROMPT
} from "./hivePrompts";
import { compileProformaLines } from "@/components/OrthoProforma";

export async function processReferralChat(messages, newInput, attachments = [], referrerInfo = null) {
  const conversationHistory = messages.map(m =>
    `${m.role === 'user' ? 'NCHD' : 'HIVE Assistant'}: ${m.content}`
  ).join('\n');

  const referrerBlock = referrerInfo && referrerInfo.referrer_name
    ? `\nREFERRER: ${referrerInfo.referrer_name}, Grade: ${referrerInfo.referrer_grade || "N/A"}, Department: ${referrerInfo.referrer_department || "N/A"}, Contact: ${referrerInfo.referrer_contact || "N/A"}\n`
    : "";

  const prompt = `${TRIAGE_SYSTEM_PROMPT}${referrerBlock}\n\nCONVERSATION HISTORY:\n${conversationHistory}\n\nNEW INPUT FROM NCHD:\n${newInput}`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    file_urls: attachments.length > 0 ? attachments : undefined,
    response_json_schema: {
      type: "object",
      properties: {
        response: { type: "string", description: "Your conversational response to the NCHD" },
        triage_decision: { type: "string", enum: ["pending", "accept", "decline", "needs_more_info"] },
        referral_summary: { type: "string" },
        reasoning: { type: "string" },
        guideline_used: { type: "string" },
        pre_clerking_guidance: { type: "string" },
        patient_name: { type: "string" },
        patient_dob: { type: "string", description: "ISO date format YYYY-MM-DD if extractable" },
        patient_mrn: { type: "string" },
        patient_gender: { type: "string", enum: ["male", "female", "other"] },
        presenting_complaint: { type: "string" },
        mechanism_of_injury: { type: "string" },
        department: { type: "string", enum: ["orthopaedics", "general_surgery"] },
        accepting_specialty: { type: "string", description: "The specific specialty accepting the referral (e.g., Orthopaedics, General Surgery)" },
        required_info: {
          type: "object",
          properties: {
            history: { type: "array", items: { type: "string" }, description: "History items still needed" },
            exam_findings: { type: "array", items: { type: "string" }, description: "Examination findings still needed" },
            investigations_imaging: { type: "array", items: { type: "string" }, description: "Investigations/imaging still needed" }
          }
        }
      }
    }
  });

  return result;
}

export async function generateClerkingProforma(diagnosis, caseSummary) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `${CLERKING_SYSTEM_PROMPT}\n\nDIAGNOSIS/CONDITION: ${diagnosis}\n\nCASE SUMMARY: ${caseSummary}\n\nGenerate a pathology-specific clerking proforma. Tailor the sections, fields, and pre_filled statements to the exact diagnosis. For trauma/fractures use "Mode of Injury" instead of "Presenting Complaint". Pre-fill generic certified statements for examinations that are not clinically appropriate. Include an auto_summary for any critical fields left blank.`,
    response_json_schema: {
      type: "object",
      properties: {
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              fields: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string" },
                    type: { type: "string" },
                    required: { type: "boolean" },
                    pre_filled: { type: "string", description: "Pre-completed generic certified statement the NCHD can override" }
                  }
                }
              }
            }
          }
        },
        auto_summary: { type: "string", description: "Generic certified statement for critical fields left blank" }
      }
    }
  });
  return result;
}

export async function generateKardex(medicationImageUrl, caseSummary, comorbidities, diagnosis) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `${KARDEX_SYSTEM_PROMPT}\n\nDIAGNOSIS: ${diagnosis}\nCOMORBIDITIES: ${comorbidities}\nCASE SUMMARY: ${caseSummary}\n\n${medicationImageUrl ? "Read the medication list from the attached image and generate the inpatient Kardex incorporating the patient's current medications." : "No medication image provided. Generate a GENERIC BASELINE KARDEX appropriate for this patient's demographic, comorbidities, and diagnosis."}`,
    file_urls: medicationImageUrl ? [medicationImageUrl] : undefined,
    response_json_schema: {
      type: "object",
      properties: {
        medications: {
          type: "array",
          items: {
            type: "object",
            properties: {
              drug: { type: "string" },
              dose: { type: "string" },
              route: { type: "string" },
              frequency: { type: "string" },
              indication: { type: "string" },
              notes: { type: "string" }
            }
          }
        },
        iv_fluids: { type: "string" },
        treatment_plan: { type: "string" },
        alerts: { type: "array", items: { type: "string" } }
      }
    }
  });
  return result;
}

export async function generateDischargeDocuments(diagnosis, caseSummary, pathway, patientName) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `${DISCHARGE_SYSTEM_PROMPT}\n\nPATIENT: ${patientName}\nDIAGNOSIS: ${diagnosis}\nDISCHARGE PATHWAY: ${pathway}\nCASE SUMMARY: ${caseSummary}\n\nGenerate the GP letter and patient education sheet.`,
    response_json_schema: {
      type: "object",
      properties: {
        gp_letter: { type: "string" },
        patient_education_sheet: { type: "string" }
      }
    }
  });
  return result;
}

export async function generateConsentChecklist(procedure, diagnosis, caseSummary) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `${CONSENT_SYSTEM_PROMPT}\n\nPROCEDURE: ${procedure}\nDIAGNOSIS: ${diagnosis}\nCASE SUMMARY: ${caseSummary}\n\nGenerate the consent discussion aid.`,
    response_json_schema: {
      type: "object",
      properties: {
        consent_aid: { type: "string" }
      }
    }
  });
  return result;
}

export async function processINEWSConsult(inewsData, patientInfo, attachmentUrls = [], labResults = [], kardexData = null, nurseNarrative = "", referrerInfo = null, comorbidities = "", geriatricOptimized = "") {
  const referrerBlock = referrerInfo && referrerInfo.referrer_name
    ? `\nREFERRER: ${referrerInfo.referrer_name}, Grade: ${referrerInfo.referrer_grade || "N/A"}, Department: ${referrerInfo.referrer_department || "N/A"}, Contact: ${referrerInfo.referrer_contact || "N/A"}\n`
    : "";

  const comorbiditiesBlock = comorbidities ? `\nCOMORBIDITIES: ${comorbidities}\n` : "\nCOMORBIDITIES: Not provided\n";
  const geriatricBlock = geriatricOptimized ? `\nGERIATRIC OPTIMIZATION STATUS: ${geriatricOptimized}\n` : "";

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `${INEWS_SYSTEM_PROMPT}${referrerBlock}

PATIENT: ${patientInfo}${comorbiditiesBlock}${geriatricBlock}
NURSE NARRATIVE (what the nurse reported): ${nurseNarrative || "No narrative provided — assess based on vitals and available data."}
INEWS DATA: ${JSON.stringify(inewsData)}
LAB RESULTS: ${labResults.length > 0 ? JSON.stringify(labResults) : "No lab results available — PROACTIVELY suggest key bloods to request (FBC, UEC, CRP, lactate, coagulation) based on the clinical picture."}
KARDEX/MEDICATIONS: ${kardexData ? JSON.stringify(kardexData) : "No kardex data available"}

Generate the assessment. CRITICAL: If the INEWS calculated_score is 0, generate a GENERIC assessment with routine review — do NOT recommend ICU/consultant escalation unless there are specific clinical red flags in the nurse narrative. Even with INEWS 0, PROACTIVELY suggest investigations and imaging that may be needed based on the presenting concern. Consider electrolyte, fluid, and endocrine derangement as potential causes.`,
    file_urls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
    response_json_schema: {
      type: "object",
      properties: {
        sbar_summary: { type: "string" },
        clinical_impression: { type: "string", description: "Working diagnosis or impression synthesising all inputs" },
        differentials: { type: "string" },
        immediate_management: { type: "string" },
        investigation_recommendations: { type: "string" },
        plan: { type: "string", description: "Comprehensive management plan with timeline" },
        recommendations: { type: "string", description: "Actionable recommendations for the ward team" },
        escalation_recommendation: { type: "string" },
        referral_summary: { type: "string", description: "Concise compiled referral summary for handover/escalation" },
        escalate_to: { type: "string", description: "Which department/team to escalate to" },
        required_info: {
          type: "object",
          properties: {
            history: { type: "array", items: { type: "string" } },
            exam_findings: { type: "array", items: { type: "string" } },
            investigations_imaging: { type: "array", items: { type: "string" } }
          }
        }
      }
    }
  });
  return result;
}

export async function recognizeLabResults(imageUrl) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a medical handwriting recognition AI. Read the handwritten lab results / bloods from this image carefully. Extract each test result with the test name, numeric value, and unit if visible.

Map test names to these standard keys: haemoglobin (Hb/Haemoglobin), wcc (WBC/WCC/White cell count), platelets (Plt/Platelets), sodium (Na/Sodium), potassium (K+/Potassium), urea (Urea/BUN), creatinine (Creat/Creatinine), crp (CRP/C-reactive protein), egfr (eGFR), bilirubin (Bili/Bilirubin), alt (ALT/Alanine transaminase), albumin (Alb/Albumin), inr (INR).

Only include results where the numeric value is clearly legible. If the image does not contain lab results, return an empty results array. Always provide raw_text with the full transcription of all handwritten content.`,
    file_urls: [imageUrl],
    response_json_schema: {
      type: "object",
      properties: {
        results: {
          type: "array",
          items: {
            type: "object",
            properties: {
              test_type: { type: "string", enum: ["haemoglobin", "wcc", "platelets", "sodium", "potassium", "urea", "creatinine", "crp", "egfr", "bilirubin", "alt", "albumin", "inr"] },
              value: { type: "number" },
              unit: { type: "string" },
              collected_at: { type: "string" }
            }
          }
        },
        raw_text: { type: "string", description: "Full raw transcription of all handwritten text visible in the image" }
      }
    }
  });
  return result;
}

export async function recognizeKardex(imageUrl) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a medical handwriting recognition AI. Read the handwritten medication kardex / drug chart from this image carefully. Extract each medication with the drug name (use generic/INN name if possible), dose, route, frequency, and any notes or indications written.

Only include medications where at least the drug name and dose are legible. If the image does not contain a medication chart, return an empty medications array. Always provide raw_text with the full transcription of all handwritten content.`,
    file_urls: [imageUrl],
    response_json_schema: {
      type: "object",
      properties: {
        medications: {
          type: "array",
          items: {
            type: "object",
            properties: {
              drug: { type: "string" },
              dose: { type: "string" },
              route: { type: "string" },
              frequency: { type: "string" },
              notes: { type: "string" }
            }
          }
        },
        raw_text: { type: "string", description: "Full raw transcription of all handwritten text visible in the image" }
      }
    }
  });
  return result;
}

export async function recognizeVitals(imageUrl) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a medical handwriting recognition AI. Read the handwritten observation chart / vital signs from this image carefully. Extract the latest set of vital signs: heart rate (HR), blood pressure systolic (BP systolic), blood pressure diastolic (BP diastolic), respiratory rate (RR), oxygen saturation (SpO2), temperature (Temp in °C), and AVPU level (Alert/Voice/Pain/Unresponsive).

Only include values that are clearly legible. If the image does not contain vital signs, return null values. Always provide raw_text with the full transcription of all handwritten content.`,
    file_urls: [imageUrl],
    response_json_schema: {
      type: "object",
      properties: {
        vitals: {
          type: "object",
          properties: {
            hr: { type: "string" },
            bp_sys: { type: "string" },
            bp_dia: { type: "string" },
            rr: { type: "string" },
            spO2: { type: "string" },
            temp: { type: "string" },
            avpu: { type: "string", enum: ["A", "V", "P", "U", ""] }
          }
        },
        raw_text: { type: "string", description: "Full raw transcription of all handwritten text visible in the image" }
      }
    }
  });
  return result;
}

export async function generateGuidelineDrugProtocol(diagnosis, weight, age, eGFR, allergies) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are HIVE Surgical Assistant. Search current clinical guidelines for the following diagnosis/indication and return the most up-to-date prescribing algorithm.

DIAGNOSIS/INDICATION: ${diagnosis}
PATIENT WEIGHT: ${weight}kg
AGE: ${age}
eGFR: ${eGFR} mL/min
ALLERGIES: ${allergies || "None known"}

Search for the latest guideline algorithm from NICE, HSE, SIGN, BOA/BOAST, NICE antimicrobial guidance, BNF, and other relevant bodies. Return:
- first_line_drugs: array of {drug, dose, route, frequency, rationale} for the recommended first-line prescribing
- alternative_drugs: array of {drug, dose, route, frequency, rationale} for alternative options (e.g. penicillin allergy, renal impairment, resistant organisms)
- guideline_algorithm: step-by-step treatment algorithm/decision tree for this diagnosis, citing the source guideline
- guideline_source: the specific guideline(s) referenced with version/year
- supportive_care: adjunctive measures (fluids, VTE prophylaxis, monitoring, etc.)
- duration: recommended treatment duration
- red_flags: when to escalate or change therapy`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        first_line_drugs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              drug: { type: "string" },
              dose: { type: "string" },
              route: { type: "string" },
              frequency: { type: "string" },
              rationale: { type: "string" }
            }
          }
        },
        alternative_drugs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              drug: { type: "string" },
              dose: { type: "string" },
              route: { type: "string" },
              frequency: { type: "string" },
              rationale: { type: "string" }
            }
          }
        },
        guideline_algorithm: { type: "string" },
        guideline_source: { type: "string" },
        supportive_care: { type: "string" },
        duration: { type: "string" },
        red_flags: { type: "string" }
      }
    }
  });
  return result;
}

export async function calculateDrugDose(drugName, weight, age, eGFR, allergies, diagnosis = "") {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `${DRUG_DOSE_SYSTEM_PROMPT}\n\nDRUG: ${drugName}\nWEIGHT: ${weight}kg\nAGE: ${age}\neGFR: ${eGFR}\nALLERGIES: ${allergies}\nDIAGNOSIS/INDICATION: ${diagnosis || "Not provided"}\n\nCalculate the recommended dose and provide full drug info, warnings, guideline protocol, and supportive care. Search current NICE, HSE, BNF, and SIGN guidelines online for the most up-to-date prescribing protocols and safety information.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        dose: { type: "string" },
        frequency: { type: "string" },
        route: { type: "string" },
        drug_info: { type: "string" },
        indications: { type: "string" },
        contraindications: { type: "string" },
        warnings: { type: "string" },
        monitoring: { type: "string" },
        guideline_protocol: { type: "string" },
        supportive_care: { type: "string" },
        reference: { type: "string" }
      }
    }
  });
  return result;
}

export async function generateAdmissionNote(caseData, selectedBloods, selectedImaging, comorbidities) {
  // Build concise proforma summary from yes/no answers using tailored generic statements
  let proformaSummary = "No proforma data";
  if (caseData.proforma_data) {
    const compiled = compileProformaLines(caseData.proforma_data, caseData);
    const lines = compiled.flatMap(g => g.lines);
    proformaSummary = lines.length > 0 ? lines.join("; ") : "No proforma data";
  }

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `${ADMISSION_NOTE_SYSTEM_PROMPT}

PATIENT: ${caseData.patient_name}, DOB: ${caseData.patient_dob || "N/A"}, MRN: ${caseData.patient_mrn || "N/A"}
DEPARTMENT: ${caseData.department}
PRESENTING COMPLAINT: ${caseData.presenting_complaint || "N/A"}
REFERRAL SUMMARY: ${caseData.referral_summary || "N/A"}
PROFORMA ANSWERS (yes/no clinical queries): ${proformaSummary}
KARDEX/TREATMENT PLAN: ${caseData.kardex_data ? JSON.stringify(caseData.kardex_data.medications?.map(m => `${m.drug} ${m.dose} ${m.frequency}`).join(", ") || "N/A") : "N/A"}
SELECTED BLOOD INVESTIGATIONS: ${selectedBloods.join(", ") || "None selected"}
SELECTED IMAGING: ${selectedImaging.join(", ") || "None selected"}
COMORBIDITIES: ${comorbidities || "Not specified"}

Generate the SHORT admission note. Maximum 20 lines. Use the proforma answers for the EXAM and KEY FINDINGS sections.`,
    response_json_schema: {
      type: "object",
      properties: {
        admission_note: { type: "string" }
      }
    }
  });
  return result;
}

export async function checkClerkingCompleteness(proformaData, diagnosis, caseSummary) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `${COMPLETENESS_CHECK_SYSTEM_PROMPT}\n\nDIAGNOSIS/CONDITION: ${diagnosis}\nCASE SUMMARY: ${caseSummary}\n\nCLERKING DATA (with field values):\n${JSON.stringify(proformaData, null, 2)}\n\nCheck this clerking against expected standards for the diagnosis. List all missing or incomplete items.`,
    response_json_schema: {
      type: "object",
      properties: {
        missing_items: { type: "array", items: { type: "string" } },
        standards_note: { type: "string" },
        is_complete: { type: "boolean" }
      }
    }
  });
  return result;
}

export async function generatePreClerkingGuidance(diagnosis, caseSummary) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `${PRE_CLERKING_SYSTEM_PROMPT}\n\nDIAGNOSIS: ${diagnosis}\nCASE SUMMARY: ${caseSummary}`,
  });
  return result;
}

export async function generateInvestigationPlan(diagnosis, caseSummary) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `${INVESTIGATION_SYSTEM_PROMPT}\n\nDIAGNOSIS: ${diagnosis}\nCASE SUMMARY: ${caseSummary}`,
    response_json_schema: {
      type: "object",
      properties: {
        investigations: { type: "string" },
        admission_recommendation: { type: "string" },
        admission_department: { type: "string" }
      }
    }
  });
  return result;
}

export async function transcribeAudio(audioUrl) {
  const result = await base44.integrations.Core.TranscribeAudio({ audio_url: audioUrl });
  return result;
}

export async function suggestInvestigations(caseData) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `${INVESTIGATION_SUGGESTION_PROMPT}

PATIENT: ${caseData.patient_name || "Unknown"}
DEPARTMENT: ${caseData.department || "N/A"}
PRESENTING COMPLAINT: ${caseData.presenting_complaint || "N/A"}
REFERRAL SUMMARY: ${caseData.referral_summary || "N/A"}
CLINICAL IMPRESSION: ${caseData.triage_reasoning || "N/A"}
INEWS SCORE: ${caseData.inews_score ?? "N/A"}
POST-OP STATUS: ${caseData.pre_op_status || "N/A"}
PROCEDURE: ${caseData.procedure_name || "N/A"}
POD: ${caseData.pod ?? "N/A"}

Suggest the most appropriate blood investigations and imaging for this patient.`,
    response_json_schema: {
      type: "object",
      properties: {
        bloods: { type: "array", items: { type: "string" } },
        imaging: { type: "array", items: { type: "string" } }
      }
    }
  });
  return result;
}

export async function uploadFile(file) {
  const result = await base44.integrations.Core.UploadFile({ file });
  return result;
}

export async function suggestManagementPlan(caseData) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a senior surgical registrar. Generate a concise, bulleted management plan for this inpatient.

PATIENT: ${caseData.patient_name || "Unknown"}, DOB: ${caseData.patient_dob || "N/A"}, MRN: ${caseData.patient_mrn || "N/A"}
DEPARTMENT: ${caseData.department || "N/A"}
PRESENTING COMPLAINT: ${caseData.presenting_complaint || "N/A"}
REFERRAL SUMMARY: ${caseData.referral_summary || "N/A"}
CLINICAL IMPRESSION: ${caseData.triage_reasoning || "N/A"}
INEWS SCORE: ${caseData.inews_score ?? "N/A"}
POST-OP STATUS: ${caseData.pre_op_status || "N/A"}
PROCEDURE: ${caseData.procedure_name || "N/A"}
INVESTIGATIONS: Bloods — ${(caseData.investigation_data?.bloods || []).join(", ") || "None"}; Imaging — ${(caseData.investigation_data?.imaging || []).join(", ") || "None"}

Provide a practical, actionable management plan as bullet points. Include: immediate actions, monitoring, medications/fluids, and escalation criteria. Keep it concise for an on-call NCHD.`,
    response_json_schema: {
      type: "object",
      properties: {
        plan: { type: "string" }
      }
    }
  });
  return result.plan;
}