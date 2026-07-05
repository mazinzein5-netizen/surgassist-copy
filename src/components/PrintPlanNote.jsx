import React, { useState } from "react";
import { Printer, FileText, X, Phone, Download, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { downloadCallNotePDF } from "@/lib/pdfExport";
import ReasoningBullets from "@/components/ReasoningBullets";

export default function PrintPlanNote({ caseData, onClose }) {
  const [emailing, setEmailing] = useState(false);
  const handlePrint = () => window.print();

  const printDate = new Date().toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" });
  const printTime = new Date().toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
  const inews = caseData.inews_data || {};

  const mainConcern = caseData.presenting_complaint || caseData.referral_summary || "—";
  const hasPlan = caseData.treatment_plan || caseData.investigation_recommendations || caseData.iv_fluid_plan || caseData.triage_reasoning;

  const handleDownloadPDF = () => {
    downloadCallNotePDF(caseData);
  };

  const handleEmail = async () => {
    const email = prompt("Enter email address to send the call note to:");
    if (!email) return;
    setEmailing(true);
    try {
      const body = buildEmailBody(caseData);
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `HIVE Call Note — ${caseData.patient_name || "Unknown"}${caseData.patient_mrn ? ` (MRN: ${caseData.patient_mrn})` : ""}`,
        body,
      });
      alert("Call note emailed successfully.");
    } catch {
      alert("Failed to send email.");
    } finally {
      setEmailing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 overflow-y-auto print:static print:bg-white print:overflow-visible">
      {/* Screen toolbar (hidden on print) */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-hive-gold" />
          <h2 className="text-sm font-semibold text-foreground">After Hours Call Note — Printout</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadPDF} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={handleEmail} disabled={emailing} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 disabled:opacity-50">
            {emailing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Email
          </button>
          <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hive-gold text-hive-gold-foreground text-xs font-medium hover:bg-hive-gold/90">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Printable content */}
      <div className="max-w-2xl mx-auto p-6 print:p-0 print:max-w-none text-black bg-white">
        {/* Header */}
        <div className="border-b-2 border-black pb-2 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-600">HIVE Surgical Assistant</p>
              <h1 className="text-lg font-bold">Inpatient After Hours Call Note</h1>
            </div>
            <p className="text-xs text-gray-500">{printDate} · {printTime}</p>
          </div>
        </div>

        {/* Patient strip */}
        <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-sm mb-3 pb-2 border-b border-gray-300">
          <p><span className="font-semibold">Patient:</span> {caseData.patient_name || "—"}</p>
          <p><span className="font-semibold">MRN:</span> {caseData.patient_mrn || "—"}</p>
          <p><span className="font-semibold">DOB:</span> {caseData.patient_dob ? new Date(caseData.patient_dob).toLocaleDateString("en-IE") : "—"}</p>
          <p><span className="font-semibold">Ward/Bed:</span> {caseData.ward || "—"}{caseData.bed_number ? ` / ${caseData.bed_number}` : ""}</p>
        </div>

        {/* MAIN CONCERN — top priority, boxed */}
        <div className="border-2 border-black rounded p-3 mb-3">
          <p className="text-xs font-bold uppercase text-gray-700 mb-1">Main Concern (Referrer)</p>
          <p className="text-sm font-medium">{mainConcern}</p>
        </div>

        {/* Referrer details */}
        {(caseData.referrer_name || caseData.referrer_grade || caseData.referrer_department || caseData.referrer_contact) && (
          <div className="flex items-start gap-2 mb-3 text-xs text-gray-700">
            <Phone className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold">Called by:</span>{" "}
              {caseData.referrer_name || "—"}
              {caseData.referrer_grade && ` (${caseData.referrer_grade})`}
              {caseData.referrer_department && `, ${caseData.referrer_department}`}
              {caseData.referrer_contact && ` · ${caseData.referrer_contact}`}
            </div>
          </div>
        )}

        {/* Vitals */}
        {(inews.hr || inews.bp_sys || inews.rr || inews.spO2 || inews.temp) && (
          <div className="mb-3">
            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Vitals {caseData.inews_score != null && `(INEWS ${caseData.inews_score})`}</p>
            <p className="text-sm">
              {[
                inews.hr && `HR ${inews.hr}`,
                inews.bp_sys && `BP ${inews.bp_sys}/${inews.bp_dia || "—"}`,
                inews.rr && `RR ${inews.rr}`,
                inews.spO2 && `SpO₂ ${inews.spO2}%`,
                inews.temp && `T ${inews.temp}°C`,
                inews.avpu && `AVPU ${inews.avpu}`,
              ].filter(Boolean).join("  ·  ")}
            </p>
          </div>
        )}

        {/* Assessment / Impression */}
        {caseData.triage_reasoning && (
          <div className="mb-3">
            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Clinical Impression</p>
            <ReasoningBullets text={caseData.triage_reasoning} />
          </div>
        )}

        {/* Investigations */}
        {caseData.investigation_recommendations && (
          <div className="mb-3">
            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Investigations</p>
            <ReasoningBullets text={caseData.investigation_recommendations} />
          </div>
        )}

        {/* Management Plan */}
        {caseData.treatment_plan && (
          <div className="mb-3">
            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Plan</p>
            <ReasoningBullets text={caseData.treatment_plan} />
          </div>
        )}

        {/* IV Fluids */}
        {caseData.iv_fluid_plan && (
          <div className="mb-3">
            <p className="text-xs font-bold uppercase text-gray-600 mb-1">IV Fluids</p>
            <p className="text-sm whitespace-pre-wrap">{caseData.iv_fluid_plan}</p>
          </div>
        )}

        {!hasPlan && (
          <p className="text-sm text-gray-500 italic">No plan or assessment has been generated for this case yet.</p>
        )}

        {/* Signature lines */}
        <div className="mt-8 pt-3 border-t border-gray-300 grid grid-cols-2 gap-8">
          <div>
            <div className="border-b border-black h-6 mb-1" />
            <p className="text-xs text-gray-600">Doctor Signature / IMC</p>
          </div>
          <div>
            <div className="border-b border-black h-6 mb-1" />
            <p className="text-xs text-gray-600">Date / Time</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildEmailBody(caseData) {
  const inews = caseData.inews_data || {};
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
  if (caseData.investigation_recommendations) { lines.push("INVESTIGATIONS:", caseData.investigation_recommendations, ""); }
  if (caseData.treatment_plan) { lines.push("PLAN:", caseData.treatment_plan, ""); }
  if (caseData.iv_fluid_plan) { lines.push("IV FLUIDS:", caseData.iv_fluid_plan, ""); }

  lines.push("", "—", "HIVE Surgical Assistant — AI-generated, verify clinically");
  return lines.join("\n");
}