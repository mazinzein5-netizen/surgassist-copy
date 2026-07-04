import { base44 } from "@/api/base44Client";
import {
  TRIAGE_SYSTEM_PROMPT, CLERKING_SYSTEM_PROMPT, KARDEX_SYSTEM_PROMPT,
  DISCHARGE_SYSTEM_PROMPT, CONSENT_SYSTEM_PROMPT, INEWS_SYSTEM_PROMPT,
  DRUG_DOSE_SYSTEM_PROMPT, PRE_CLERKING_SYSTEM_PROMPT, INVESTIGATION_SYSTEM_PROMPT
} from "./hivePrompts";

export async function processReferralChat(messages, newInput, attachments = []) {
  const conversationHistory = messages.map(m =>
    `${m.role === 'user' ? 'NCHD' : 'HIVE Assistant'}: ${m.content}`
  ).join('\n');

  const prompt = `${TRIAGE_SYSTEM_PROMPT}\n\nCONVERSATION HISTORY:\n${conversationHistory}\n\nNEW INPUT FROM NCHD:\n${newInput}`;

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
        patient_dob: { type: "string" },
        patient_mrn: { type: "string" },
        presenting_complaint: { type: "string" },
        mechanism_of_injury: { type: "string" },
        department: { type: "string", enum: ["orthopaedics", "general_surgery"] }
      }
    }
  });

  return result;
}

export async function generateClerkingProforma(diagnosis, caseSummary) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `${CLERKING_SYSTEM_PROMPT}\n\nDIAGNOSIS/CONDITION: ${diagnosis}\n\nCASE SUMMARY: ${caseSummary}\n\nGenerate a structured clerking proforma as a JSON object with sections array, each containing title and fields array (each field has label, type, and required).`,
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
                    required: { type: "boolean" }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
  return result;
}

export async function generateKardex(medicationImageUrl, caseSummary, comorbidities, diagnosis) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `${KARDEX_SYSTEM_PROMPT}\n\nDIAGNOSIS: ${diagnosis}\nCOMORBIDITIES: ${comorbidities}\nCASE SUMMARY: ${caseSummary}\n\nRead the medication list from the attached image and generate the inpatient Kardex.`,
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

export async function processINEWSConsult(inewsData, patientInfo, attachmentUrls = []) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `${INEWS_SYSTEM_PROMPT}\n\nPATIENT: ${patientInfo}\nINEWS DATA: ${JSON.stringify(inewsData)}\n\nGenerate the escalation assessment.`,
    file_urls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
    response_json_schema: {
      type: "object",
      properties: {
        sbar_summary: { type: "string" },
        differentials: { type: "string" },
        immediate_management: { type: "string" },
        investigation_recommendations: { type: "string" },
        escalation_recommendation: { type: "string" }
      }
    }
  });
  return result;
}

export async function calculateDrugDose(drugName, weight, age, eGFR, allergies) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `${DRUG_DOSE_SYSTEM_PROMPT}\n\nDRUG: ${drugName}\nWEIGHT: ${weight}kg\nAGE: ${age}\neGFR: ${eGFR}\nALLERGIES: ${allergies}\n\nCalculate the recommended dose.`,
    response_json_schema: {
      type: "object",
      properties: {
        dose: { type: "string" },
        frequency: { type: "string" },
        route: { type: "string" },
        warnings: { type: "string" },
        reference: { type: "string" }
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

export async function uploadFile(file) {
  const result = await base44.integrations.Core.UploadFile({ file });
  return result;
}