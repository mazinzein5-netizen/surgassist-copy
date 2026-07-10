import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import { Download, FileText, FileType, ChevronDown, Loader2 } from "lucide-react";

export default function HandoverExportMenu({ grouped, caseCount }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buildHandoverText = () => {
    let lines = [];
    lines.push("END-OF-SHIFT HANDOVER — ISBAR SUMMARY");
    lines.push(`Generated: ${new Date().toLocaleString("en-IE")}`);
    lines.push(`Active cases: ${caseCount}`);
    lines.push("");
    lines.push("=".repeat(60));
    lines.push("");

    for (const [group, groupCases] of Object.entries(grouped)) {
      lines.push(`${group.toUpperCase()} (${groupCases.length})`);
      lines.push("-".repeat(40));
      for (const c of groupCases) {
        lines.push(`Patient: ${c.patient_name}`);
        lines.push(`  MRN: ${c.patient_mrn || "N/A"} | Dept: ${(c.department || "").replace(/_/g, " ")}`);
        lines.push(`  I — Identity: ${c.patient_name}, MRN: ${c.patient_mrn || "N/A"}`);
        lines.push(`  S — Situation: ${c.presenting_complaint || (c.referral_summary || "").slice(0, 120) || "N/A"}`);
        lines.push(`  B — Background: Triage: ${(c.triage_decision || "N/A").toUpperCase()}. ${c.triage_guideline || ""}`);
        lines.push(`  A — Assessment: ${(c.treatment_plan || "Assessment in progress").slice(0, 200)}`);
        lines.push(`  R — Recommendation: ${(c.admission_recommendation || "Continue current management").slice(0, 150)}`);
        if (c.ward || c.bed_number) lines.push(`  Location: ${c.ward || "—"}${c.bed_number ? ` / Bed ${c.bed_number}` : ""}`);
        if (c.on_call_consultant || c.on_call_registrar || c.on_call_sho) {
          lines.push(`  Team: ${c.on_call_consultant || "—"} (Cons), ${c.on_call_registrar || "—"} (Reg), ${c.on_call_sho || "—"} (SHO)`);
        }
        lines.push("");
      }
      lines.push("");
    }

    lines.push("=".repeat(60));
    lines.push("HIVE Surgical Assistant — AI-assisted, verify clinically");
    return lines;
  };

  const handleExportPDF = () => {
    setExporting("pdf");
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 18;
      const maxWidth = pageWidth - margin * 2;
      let y = margin;

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("HIVE SURGICAL ASSISTANT", margin, y);
      y += 6;
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text("End-of-Shift Handover", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Generated: ${new Date().toLocaleString("en-IE")}  |  Active cases: ${caseCount}`, margin, y);
      y += 4;
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      for (const [group, groupCases] of Object.entries(grouped)) {
        if (y > pageHeight - margin - 20) { doc.addPage(); y = margin; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(40);
        doc.text(`${group} (${groupCases.length})`, margin, y);
        y += 6;
        doc.setDrawColor(220);
        doc.setLineWidth(0.2);
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;

        for (const c of groupCases) {
          if (y > pageHeight - margin - 30) { doc.addPage(); y = margin; }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(0);
          doc.text(c.patient_name || "Unknown", margin, y);
          y += 5;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(80);
          doc.text(`MRN: ${c.patient_mrn || "N/A"}  |  Dept: ${(c.department || "").replace(/_/g, " ")}`, margin, y);
          y += 5;

          const isbar = [
            `I: ${c.patient_name}, MRN: ${c.patient_mrn || "N/A"}`,
            `S: ${c.presenting_complaint || (c.referral_summary || "").slice(0, 100) || "N/A"}`,
            `B: Triage: ${(c.triage_decision || "N/A").toUpperCase()}. ${c.triage_guideline || ""}`,
            `A: ${(c.treatment_plan || "Assessment in progress").slice(0, 150)}`,
            `R: ${(c.admission_recommendation || "Continue current management").slice(0, 120)}`,
          ];
          doc.setTextColor(0);
          for (const line of isbar) {
            const wrapped = doc.splitTextToSize(line, maxWidth);
            for (const w of wrapped) {
              if (y > pageHeight - margin - 8) { doc.addPage(); y = margin; }
              doc.text(w, margin + 3, y);
              y += 4.5;
            }
          }
          y += 3;
        }
        y += 4;
      }

      // Footer
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

      doc.save(`Handover_Summary_${new Date().toISOString().split("T")[0]}.pdf`);
    } finally {
      setExporting(null);
      setOpen(false);
    }
  };

  const handleExportDocx = () => {
    setExporting("docx");
    try {
      const lines = buildHandoverText();
      const bodyHtml = lines
        .map((line) => {
          if (line.startsWith("=".repeat(60))) return "<hr/>";
          if (line.startsWith("-".repeat(40))) return "<hr style='border:1px solid #ccc;'/>";
          if (/^[A-Z].*\(\d+\)$/.test(line) && line === line.toUpperCase()) return `<h3 style='color:#1a365d;margin:12px 0 4px;'>${line}</h3>`;
          return `<p style='margin:1px 0;font-size:11pt;'>${line || "&nbsp;"}</p>`;
        })
        .join("");

      const html = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Handover Summary</title></head>
<body style='font-family:Calibri,Arial,sans-serif;font-size:11pt;'>
<h1 style='color:#1a365d;font-size:16pt;'>End-of-Shift Handover — ISBAR Summary</h1>
${bodyHtml}
</body></html>`;

      const blob = new Blob([html], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Handover_Summary_${new Date().toISOString().split("T")[0]}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={exporting !== null}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-foreground font-medium text-sm hover:bg-secondary/80 disabled:opacity-50"
      >
        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        <span className="hidden sm:inline">{exporting ? "Exporting..." : "Export"}</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors text-left"
          >
            <FileText className="w-4 h-4 text-hive-gold" />
            Export as PDF
          </button>
          <button
            onClick={handleExportDocx}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors text-left border-t border-border"
          >
            <FileType className="w-4 h-4 text-accent" />
            Export as DOCX
          </button>
        </div>
      )}
    </div>
  );
}