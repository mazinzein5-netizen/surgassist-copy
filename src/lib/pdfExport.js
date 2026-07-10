import jsPDF from "jspdf";
import { compileProformaLines } from "@/components/OrthoProforma";

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
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`Referral Time: ${caseData.created_date ? new Date(caseData.created_date).toLocaleString("en-IE") : "—"}`, margin, y);
  doc.text(`Note Time: ${caseData.countersigned_at ? new Date(caseData.countersigned_at).toLocaleString("en-IE") : new Date().toLocaleString("en-IE")}`, pageWidth - margin - 60, y);
  y += 5;
  doc.setTextColor(0);
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

  // Structured investigations (bloods + imaging)
  const invData = caseData.investigation_data || {};
  if (invData.bloods?.length || invData.imaging?.length) {
    if (invData.bloods?.length) {
      ensureSpace(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text("BLOOD INVESTIGATIONS", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0);
      for (const b of invData.bloods) {
        ensureSpace(5);
        doc.text(`- ${b}`, margin + 3, y);
        y += 5;
      }
      y += 3;
    }
    if (invData.imaging?.length) {
      ensureSpace(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text("IMAGING", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0);
      for (const im of invData.imaging) {
        ensureSpace(5);
        doc.text(`- ${im}`, margin + 3, y);
        y += 5;
      }
      y += 3;
    }
  } else if (caseData.investigation_recommendations) {
    writeSection("Investigations", caseData.investigation_recommendations);
  }

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

/**
 * Exports the FULL patient case file as a well-organized PDF with all sections,
 * locked timestamps, author attribution, and team labels.
 * Returns the jsPDF doc instance.
 */
export function exportFullCasePDF(caseData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed = 8) => {
    if (y + needed > pageHeight - margin - 8) {
      doc.addPage();
      y = margin;
    }
  };

  const writeTitle = (text, size = 10) => {
    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(40);
    doc.text(text, margin, y);
    y += size * 0.5 + 2;
  };

  const writeBody = (text) => {
    if (!text) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0);
    const clean = String(text).replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
    const lines = doc.splitTextToSize(clean, maxWidth);
    for (const line of lines) {
      ensureSpace(5);
      doc.text(line, margin, y);
      y += 5;
    }
    y += 3;
  };

  const writeNoteMeta = (author, lockedAt) => {
    if (!author && !lockedAt) return;
    ensureSpace(5);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120);
    const parts = [];
    if (author) parts.push(`Author: ${author}`);
    if (lockedAt) parts.push(`Locked: ${new Date(lockedAt).toLocaleString("en-IE")}`);
    doc.text(parts.join("  |  "), margin, y);
    y += 5;
  };

  const writeSection = (title, text, meta) => {
    if (!text) return;
    ensureSpace(12);
    writeTitle(title);
    writeNoteMeta(meta?.author, meta?.lockedAt);
    writeBody(text);
    ensureSpace(3);
    doc.setDrawColor(220);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  // === HEADER ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("HIVE SURGICAL ASSISTANT", margin, y);
  y += 6;
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text("Patient Case File", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Exported: ${new Date().toLocaleString("en-IE")}`, margin, y);
  y += 3;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // === PATIENT DEMOGRAPHICS ===
  doc.setFontSize(9);
  doc.setTextColor(0);
  const demoLines = [
    `Patient: ${caseData.patient_name || "—"}`,
    `DOB: ${caseData.patient_dob ? new Date(caseData.patient_dob).toLocaleDateString("en-IE") : "—"}`,
    `MRN: ${caseData.patient_mrn || "—"}`,
    `Gender: ${caseData.patient_gender ? caseData.patient_gender.charAt(0).toUpperCase() + caseData.patient_gender.slice(1) : "—"}`,
  ];
  demoLines.forEach(line => {
    ensureSpace(5);
    doc.text(line, margin, y);
    y += 5;
  });

  // === TEAM LABELS ===
  y += 2;
  ensureSpace(8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text("TEAM", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0);
  const teamParts = [];
  if (caseData.specialty) teamParts.push(`Specialty: ${caseData.specialty}`);
  if (caseData.accepting_specialty) teamParts.push(`Accepting: ${caseData.accepting_specialty}`);
  if (caseData.on_call_consultant) teamParts.push(`Consultant: ${caseData.on_call_consultant}`);
  if (caseData.on_call_registrar) teamParts.push(`Registrar: ${caseData.on_call_registrar}`);
  if (caseData.on_call_sho) teamParts.push(`SHO: ${caseData.on_call_sho}`);
  if (caseData.referring_team) teamParts.push(`Referring: ${caseData.referring_team}`);
  teamParts.forEach(part => {
    ensureSpace(5);
    doc.text(`  • ${part}`, margin, y);
    y += 5;
  });
  y += 2;

  // === REFERRER ===
  if (caseData.referrer_name || caseData.referrer_department) {
    ensureSpace(5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(80);
    doc.text("REFERRER", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0);
    const ref = `  ${caseData.referrer_name || "—"}${caseData.referrer_grade ? ` (${caseData.referrer_grade})` : ""}${caseData.referrer_department ? `, ${caseData.referrer_department}` : ""}${caseData.referrer_contact ? ` · ${caseData.referrer_contact}` : ""}`;
    const refLines = doc.splitTextToSize(ref, maxWidth);
    refLines.forEach(line => { ensureSpace(5); doc.text(line, margin, y); y += 5; });
    y += 2;
  }

  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // === CLINICAL SECTIONS ===
  const meta = {
    author: caseData.note_author_name,
    grade: caseData.note_author_grade,
    imc: caseData.note_author_imc,
    lockedAt: caseData.note_locked_at,
  };
  const metaLabel = meta.author
    ? `${meta.author}${meta.grade ? ` (${meta.grade})` : ""}${meta.imc ? `, IMC: ${meta.imc}` : ""}`
    : null;

  writeSection("Presenting Complaint", caseData.presenting_complaint);
  writeSection("Referral Summary", caseData.referral_summary);
  writeSection("Mechanism of Injury", caseData.mechanism_of_injury);

  if (caseData.triage_decision && caseData.triage_decision !== "pending") {
    const triageText = `Decision: ${caseData.triage_decision === "accept" && caseData.accepting_specialty ? `Accepted — ${caseData.accepting_specialty}` : caseData.triage_decision.replace(/_/g, " ")}\n${caseData.triage_reasoning || ""}${caseData.triage_guideline ? `\nGuideline: ${caseData.triage_guideline}` : ""}`;
    writeSection("Triage Decision", triageText);
  }

  writeSection("Pre-Clerking Guidance", caseData.pre_clerking_guidance, { author: "AI Assistant", lockedAt: caseData.created_date });
  writeSection("Admission Note", caseData.admission_note, { author: metaLabel, lockedAt: meta.lockedAt });

  // Kardex / Medications
  if (caseData.kardex_data) {
    const k = caseData.kardex_data;
    let kardexText = "";
    if (k.medications?.length) {
      kardexText = k.medications.map(m => `${m.drug} ${m.dose} ${m.route} ${m.frequency} — ${m.indication || ""}${m.notes ? ` (${m.notes})` : ""}`).join("\n");
    }
    if (k.iv_fluids) kardexText += `\n\nIV Fluids: ${k.iv_fluids}`;
    if (k.treatment_plan) kardexText += `\n\nTreatment Plan: ${k.treatment_plan}`;
    writeSection("Inpatient Kardex", kardexText, { author: metaLabel, lockedAt: meta.lockedAt });
  }

  writeSection("IV Fluid Plan", caseData.iv_fluid_plan, { author: metaLabel, lockedAt: meta.lockedAt });
  writeSection("Treatment / Management Plan", caseData.treatment_plan, { author: metaLabel, lockedAt: meta.lockedAt });

  // Investigations
  const invData = caseData.investigation_data || {};
  if (invData.bloods?.length || invData.imaging?.length) {
    let invText = "";
    if (invData.bloods?.length) invText += `Bloods:\n${invData.bloods.map(b => `  - ${b}`).join("\n")}`;
    if (invData.imaging?.length) invText += `\n\nImaging:\n${invData.imaging.map(im => `  - ${im}`).join("\n")}`;
    writeSection("Investigations", invText);
  }
  writeSection("Investigation Recommendations", caseData.investigation_recommendations);

  // Proforma / Clerking
  if (caseData.proforma_data) {
    try {
      const compiled = compileProformaLines(caseData.proforma_data, caseData);
      if (compiled.length > 0) {
        const proformaText = compiled.map(g => `${g.section}:\n${g.lines.map(l => `  - ${l}`).join("\n")}`).join("\n\n");
        writeSection("Clerking Proforma", proformaText);
      }
    } catch {}
  }

  // Discharge
  writeSection("GP Discharge Letter", caseData.gp_letter, { author: metaLabel, lockedAt: meta.lockedAt });
  writeSection("Patient Education Sheet", caseData.patient_education_sheet, { author: metaLabel, lockedAt: meta.lockedAt });

  // Review
  if (caseData.review_notes) {
    const reviewMeta = caseData.countersigned_at
      ? { author: `Dr. ${caseData.note_author_name || ""} (IMC: ${caseData.reviewer_imc || "N/A"})`, lockedAt: caseData.countersigned_at }
      : null;
    writeSection("Review Notes", caseData.review_notes, reviewMeta);
  }

  // === SIGNATURE BLOCK ===
  ensureSpace(20);
  y += 6;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + 70, y);
  doc.line(pageWidth - margin - 70, y, pageWidth - margin, y);
  y += 4;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Doctor Signature / IMC", margin, y);
  doc.text("Date / Time", pageWidth - margin - 70, y);
  if (caseData.note_locked_at) {
    y += 5;
    doc.setTextColor(120);
    doc.text(`Note locked: ${new Date(caseData.note_locked_at).toLocaleString("en-IE")}${caseData.note_author_name ? ` by ${caseData.note_author_name}` : ""}`, margin, y);
  }

  // === FOOTER ===
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `HIVE Surgical Assistant — Page ${i} of ${pageCount} — AI-assisted, verify clinically`,
      margin,
      pageHeight - 8
    );
  }

  return doc;
}

export function downloadFullCasePDF(caseData) {
  const doc = exportFullCasePDF(caseData);
  const fileName = `CaseFile_${(caseData.patient_name || "Unknown").replace(/\s/g, "_")}${caseData.patient_mrn ? "_" + caseData.patient_mrn : ""}.pdf`;
  doc.save(fileName);
}