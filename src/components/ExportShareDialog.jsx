import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { downloadFullCasePDF } from "@/lib/pdfExport";
import { Loader2, Download, Send, MessageCircle, Radio, Mail, Bluetooth, Share2, X, FileText } from "lucide-react";

const SHARE_OPTIONS = [
  { id: "email", label: "Email", icon: Mail },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "signal", label: "Signal", icon: Radio },
  { id: "bluetooth", label: "Bluetooth", icon: Bluetooth },
  { id: "airdrop", label: "AirDrop", icon: Share2 },
];

export default function ExportShareDialog({ caseData, onClose }) {
  const [exporting, setExporting] = useState(false);
  const [sending, setSending] = useState(null);
  const [pdfReady, setPdfReady] = useState(false);

  const patientName = caseData?.patient_name || "Unknown";
  const subject = `HIVE — Case File — ${patientName}`;

  const buildSummaryText = () => {
    if (!caseData) return "";
    const lines = [
      `HIVE SURGICAL ASSISTANT — CASE FILE`,
      `Patient: ${caseData.patient_name || "—"}`,
      `MRN: ${caseData.patient_mrn || "—"}`,
      `DOB: ${caseData.patient_dob ? new Date(caseData.patient_dob).toLocaleDateString("en-IE") : "—"}`,
      ``,
      `--- PRESENTING COMPLAINT ---`,
      caseData.presenting_complaint || "N/A",
      ``,
      `--- REFERRAL SUMMARY ---`,
      caseData.referral_summary || "N/A",
      ``,
      `--- TRIAGE ---`,
      `Decision: ${caseData.triage_decision || "pending"}`,
      caseData.triage_reasoning || "",
      ``,
      `--- MANAGEMENT PLAN ---`,
      caseData.treatment_plan || "N/A",
      ``,
      `--- ADMISSION NOTE ---`,
      caseData.admission_note || "N/A",
    ];
    if (caseData.note_author_name) {
      lines.push(``, `Note by: ${caseData.note_author_name}${caseData.note_author_grade ? ` (${caseData.note_author_grade})` : ""}`);
    }
    if (caseData.note_locked_at) {
      lines.push(`Locked: ${new Date(caseData.note_locked_at).toLocaleString("en-IE")}`);
    }
    return lines.join("\n");
  };

  const handleExportPDF = () => {
    setExporting(true);
    try {
      downloadFullCasePDF(caseData);
      setPdfReady(true);
    } catch {
      alert("Failed to generate PDF.");
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async (service) => {
    setSending(service);
    const summary = buildSummaryText();
    const truncated = summary.length > 4000 ? summary.slice(0, 4000) + "\n[...truncated]" : summary;

    try {
      switch (service) {
        case "email": {
          const email = prompt("Enter recipient email address:");
          if (!email) break;
          await base44.integrations.Core.SendEmail({ to: email, subject, body: summary });
          alert("Email sent successfully.");
          break;
        }
        case "whatsapp": {
          await navigator.clipboard?.writeText(summary).catch(() => {});
          window.open(`https://wa.me/?text=${encodeURIComponent(truncated)}`, "_blank");
          alert("Case summary copied. WhatsApp opened — paste if needed.");
          break;
        }
        case "signal": {
          await navigator.clipboard?.writeText(summary).catch(() => {});
          window.open("https://signal.me/", "_blank");
          alert("Case summary copied. Signal opened — paste into your chat.");
          break;
        }
        case "bluetooth":
        case "airdrop": {
          // Try Web Share API with file if supported (mobile/desktop)
          if (navigator.share) {
            try {
              // First generate the PDF as a blob for sharing
              const { exportFullCasePDF } = await import("@/lib/pdfExport");
              const doc = exportFullCasePDF(caseData);
              const pdfBlob = doc.output("blob");
              const file = new File([pdfBlob], `CaseFile_${patientName.replace(/\s/g, "_")}.pdf`, { type: "application/pdf" });

              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                  files: [file],
                  title: subject,
                  text: `Case file for ${patientName}`,
                });
              } else {
                // Fallback: share text only
                await navigator.share({ title: subject, text: truncated });
                alert("PDF sharing not supported on this device. Text summary shared instead.");
              }
            } catch (shareErr) {
              if (shareErr.name !== "AbortError") {
                alert("Sharing not available. Download the PDF and share manually.");
                handleExportPDF();
              }
            }
          } else {
            alert("Direct sharing not available on this device. Download the PDF and share manually via Bluetooth/AirDrop.");
            handleExportPDF();
          }
          break;
        }
      }
    } catch {
      alert(`Failed to share via ${service}.`);
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-hive-gold" />
            <h3 className="font-semibold text-foreground text-sm">Export & Share Case File</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Patient info */}
        <div className="px-5 py-3 bg-background/50 border-b border-border">
          <p className="text-sm font-medium text-foreground">{patientName}</p>
          <p className="text-xs text-muted-foreground">
            {caseData?.patient_mrn && `MRN: ${caseData.patient_mrn} · `}
            {caseData?.patient_dob && `DOB: ${new Date(caseData.patient_dob).toLocaleDateString("en-IE")}`}
          </p>
          {caseData?.note_locked_at && (
            <p className="text-[10px] text-muted-foreground mt-1">
              🔒 Note locked: {new Date(caseData.note_locked_at).toLocaleString("en-IE")}
              {caseData.note_author_name && ` by ${caseData.note_author_name}`}
            </p>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Export PDF */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Step 1 — Generate PDF</p>
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-hive-gold text-hive-gold-foreground text-sm font-semibold hover:bg-hive-gold/90 disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {pdfReady ? "Re-download PDF" : "Export Full Case (PDF)"}
            </button>
            {pdfReady && (
              <p className="text-[10px] text-success mt-1.5 flex items-center gap-1">
                ✓ PDF downloaded. Choose a share option below.
              </p>
            )}
          </div>

          {/* Share options */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Step 2 — Send To</p>
            <div className="grid grid-cols-3 gap-2">
              {SHARE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isLoading = sending === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleShare(opt.id)}
                    disabled={isLoading}
                    className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 hover:border-hive-gold/30 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-hive-gold" /> : <Icon className="w-5 h-5 text-foreground" />}
                    <span className="text-[10px] font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note metadata */}
          {caseData?.note_author_name && (
            <div className="bg-background/50 rounded-lg px-3 py-2 border border-border/50">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Note Attribution</p>
              <p className="text-xs text-foreground">
                {caseData.note_author_name}
                {caseData.note_author_grade && ` (${caseData.note_author_grade})`}
                {caseData.note_author_imc && `, IMC: ${caseData.note_author_imc}`}
              </p>
              {caseData.note_locked_at && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Locked: {new Date(caseData.note_locked_at).toLocaleString("en-IE")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}