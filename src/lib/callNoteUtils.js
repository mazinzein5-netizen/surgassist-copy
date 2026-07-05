export function buildCallNoteText(caseData) {
  const inews = caseData.inews_data || {};
  const invData = caseData.investigation_data || {};
  const lines = [
    "HIVE SURGICAL ASSISTANT — INPATIENT AFTER HOURS CALL NOTE",
    `Generated: ${new Date().toLocaleString("en-IE")}`,
    "",
    `Patient: ${caseData.patient_name || "—"}`,
    `MRN: ${caseData.patient_mrn || "—"}`,
    `DOB: ${caseData.patient_dob ? new Date(caseData.patient_dob).toLocaleDateString("en-IE") : "—"}`,
    `Ward/Bed: ${caseData.ward || "—"}${caseData.bed_number ? ` / ${caseData.bed_number}` : ""}`,
    "",
    "MAIN CONCERN (REFERRER):",
    caseData.presenting_complaint || caseData.referral_summary || "—",
    "",
  ];

  if (caseData.referrer_name || caseData.referrer_department) {
    lines.push(`Called by: ${caseData.referrer_name || "—"}${caseData.referrer_grade ? ` (${caseData.referrer_grade})` : ""}${caseData.referrer_department ? `, ${caseData.referrer_department}` : ""}${caseData.referrer_contact ? ` · ${caseData.referrer_contact}` : ""}`);
    lines.push("");
  }

  if (inews.hr || inews.bp_sys || inews.rr || inews.spO2 || inews.temp) {
    lines.push(`VITALS${caseData.inews_score != null ? ` (INEWS ${caseData.inews_score})` : ""}:`);
    lines.push([
      inews.hr && `HR ${inews.hr}`,
      inews.bp_sys && `BP ${inews.bp_sys}/${inews.bp_dia || "—"}`,
      inews.rr && `RR ${inews.rr}`,
      inews.spO2 && `SpO2 ${inews.spO2}%`,
      inews.temp && `T ${inews.temp}°C`,
      inews.avpu && `AVPU ${inews.avpu}`,
    ].filter(Boolean).join("  ·  "));
    lines.push("");
  }

  if (caseData.triage_reasoning) { lines.push("CLINICAL IMPRESSION:", caseData.triage_reasoning, ""); }

  if (invData.bloods?.length) {
    lines.push("BLOOD INVESTIGATIONS:");
    invData.bloods.forEach(b => lines.push(`- ${b}`));
    lines.push("");
  }
  if (invData.imaging?.length) {
    lines.push("IMAGING:");
    invData.imaging.forEach(im => lines.push(`- ${im}`));
    lines.push("");
  }

  if (caseData.treatment_plan) { lines.push("PLAN:", caseData.treatment_plan, ""); }
  if (caseData.iv_fluid_plan) { lines.push("IV FLUIDS:", caseData.iv_fluid_plan, ""); }

  lines.push("", "—", "HIVE Surgical Assistant — AI-generated, verify clinically");
  return lines.join("\n");
}