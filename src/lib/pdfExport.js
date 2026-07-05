import jsPDF from "jspdf";

export function exportTextToPDF(title, text, patientName = "") {
  // Strip markdown symbols for clean presentation
  const cleanText = text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`(.+?)`/g, "$1");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  // Header
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, y);
  y += 8;

  if (patientName) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Patient: ${patientName}`, margin, y);
    y += 6;
  }

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleString("en-IE")}`, margin, y);
  y += 4;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  doc.setTextColor(0);

  // Body
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(cleanText, maxWidth);
  const lineHeight = 5;

  lines.forEach((line) => {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  });

  // Footer on each page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `HIVE Surgical Assistant — Page ${i} of ${pageCount} — AI-generated, verify clinically`,
      margin,
      pageHeight - 10
    );
  }

  const fileName = `${title.replace(/[^a-zA-Z0-9]/g, "_")}${patientName ? "_" + patientName.replace(/\s/g, "_") : ""}.pdf`;
  doc.save(fileName);
}

/**
 * Generates a formatted PDF of the Inpatient After Hours Call Note.
 * Returns the jsPDF doc instance (call .save() or .output() on it).
 */
export function exportCallNoteToPDF(caseData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed = 8) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeSection = (label, text) => {
    if (!text) return;
    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(label.toUpperCase(), margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0);
    const clean = String(text).replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
    const lines = doc.splitTextToSize(clean, maxWidth);
    for (const line of lines) {
      ensureSpace(6);
      doc.text(line, margin, y);
      y += 5;
    }
    y += 3;
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("HIVE SURGICAL ASSISTANT", margin, y);
  y += 6;
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text("Inpatient After Hours Call Note", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`${new Date().toLocaleString("en-IE")}`, margin, y);
  y += 3;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Patient strip
  doc.setFontSize(9);
  doc.setTextColor(0);
  const patientLine = `Patient: ${caseData.patient_name || "—"}`;
  const mrnLine = `MRN: ${caseData.patient_mrn || "—"}`;
  const dobLine = `DOB: ${caseData.patient_dob ? new Date(caseData.patient_dob).toLocaleDateString("en-IE") : "—"}`;
  const wardLine = `Ward/Bed: ${caseData.ward || "—"}${caseData.bed_number ? ` / ${caseData.bed_number}` : ""}`;
  doc.text(patientLine, margin, y);
  doc.text(mrnLine, pageWidth - margin - 60, y);
  y += 5;
  doc.text(dobLine, margin, y);
  doc.text(wardLine, pageWidth - margin - 60, y);
  y += 5;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Main concern — boxed
  const concern = caseData.presenting_complaint || caseData.referral_summary || "—";
  ensureSpace(14);
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(margin, y - 2, maxWidth, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text("MAIN CONCERN (REFERRER)", margin + 3, y + 2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0);
  const concernLines = doc.splitTextToSize(concern, maxWidth - 6);
  doc.text(concernLines[0] || "—", margin + 3, y + 7);
  y += 14;

  // Referrer
  if (caseData.referrer_name || caseData.referrer_grade || caseData.referrer_department) {
    ensureSpace(6);
    doc.setFontSize(8);
    doc.setTextColor(100);
    const ref = `Called by: ${caseData.referrer_name || "—"}${caseData.referrer_grade ? ` (${caseData.referrer_grade})` : ""}${caseData.referrer_department ? `, ${caseData.referrer_department}` : ""}${caseData.referrer_contact ? ` · ${caseData.referrer_contact}` : ""}`;
    doc.text(ref, margin, y);
    y += 5;
  }

  // Vitals
  const inews = caseData.inews_data || {};
  if (inews.hr || inews.bp_sys || inews.rr || inews.spO2 || inews.temp) {
    ensureSpace(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(`VITALS${caseData.inews_score != null ? ` (INEWS ${caseData.inews_score})` : ""}`, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0);
    const vitalsStr = [
      inews.hr && `HR ${inews.hr}`,
      inews.bp_sys && `BP ${inews.bp_sys}/${inews.bp_dia || "—"}`,
      inews.rr && `RR ${inews.rr}`,
      inews.spO2 && `SpO2 ${inews.spO2}%`,
      inews.temp && `T ${inews.temp}C`,
      inews.avpu && `AVPU ${inews.avpu}`,
    ].filter(Boolean).join("   ");
    doc.text(vitalsStr, margin, y);
    y += 7;
  }

  // Sections
  writeSection("Clinical Impression", caseData.triage_reasoning);
  writeSection("Investigations", caseData.investigation_recommendations);
  writeSection("Plan", caseData.treatment_plan);
  writeSection("IV Fluids", caseData.iv_fluid_plan);

  // Signature lines
  ensureSpace(20);
  y += 8;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + 70, y);
  doc.line(pageWidth - margin - 70, y, pageWidth - margin, y);
  y += 4;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Doctor Signature / IMC", margin, y);
  doc.text("Date / Time", pageWidth - margin - 70, y);

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `HIVE Surgical Assistant — Page ${i} of ${pageCount} — AI-generated, verify clinically`,
      margin,
      pageHeight - 8
    );
  }

  return doc;
}

export function downloadCallNotePDF(caseData) {
  const doc = exportCallNoteToPDF(caseData);
  const fileName = `CallNote_${(caseData.patient_name || "Unknown").replace(/\s/g, "_")}${caseData.patient_mrn ? "_" + caseData.patient_mrn : ""}.pdf`;
  doc.save(fileName);
}