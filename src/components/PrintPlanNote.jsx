import React from "react";
import { Printer, FileText, X } from "lucide-react";

export default function PrintPlanNote({ caseData, onClose }) {
  const handlePrint = () => window.print();

  const printDate = new Date().toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" });
  const inews = caseData.inews_data || {};

  const hasAny = caseData.admission_note || caseData.treatment_plan || caseData.investigation_recommendations || caseData.iv_fluid_plan;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 overflow-y-auto print:static print:bg-white print:overflow-visible">
      {/* Screen toolbar (hidden on print) */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-hive-gold" />
          <h2 className="text-sm font-semibold text-foreground">Printable Plan & Note</h2>
        </div>
        <div className="flex items-center gap-2">
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
        <div className="border-b-2 border-black pb-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-600">HIVE Surgical Assistant</p>
              <h1 className="text-lg font-bold">Inpatient Plan & Note</h1>
            </div>
            <p className="text-xs text-gray-500">Printed: {printDate}</p>
          </div>
        </div>

        {/* Patient strip */}
        <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-sm mb-4 pb-3 border-b border-gray-300">
          <p><span className="font-semibold">Patient:</span> {caseData.patient_name || "—"}</p>
          <p><span className="font-semibold">MRN:</span> {caseData.patient_mrn || "—"}</p>
          <p><span className="font-semibold">DOB:</span> {caseData.patient_dob ? new Date(caseData.patient_dob).toLocaleDateString("en-IE") : "—"}</p>
          <p><span className="font-semibold">Ward/Bed:</span> {caseData.ward || "—"}{caseData.bed_number ? ` / ${caseData.bed_number}` : ""}</p>
          {caseData.inews_score != null && (
            <p><span className="font-semibold">INEWS:</span> {caseData.inews_score}</p>
          )}
          {caseData.procedure_name && (
            <p><span className="font-semibold">Procedure:</span> {caseData.procedure_name}</p>
          )}
        </div>

        {/* Vitals (if present) */}
        {(inews.hr || inews.bp_sys || inews.rr || inews.spO2 || inews.temp) && (
          <div className="mb-3">
            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Vitals</p>
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

        {/* Admission Note */}
        {caseData.admission_note && (
          <div className="mb-3">
            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Admission Note</p>
            <p className="text-sm whitespace-pre-wrap">{caseData.admission_note}</p>
          </div>
        )}

        {/* Investigations */}
        {caseData.investigation_recommendations && (
          <div className="mb-3">
            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Investigations</p>
            <p className="text-sm whitespace-pre-wrap">{caseData.investigation_recommendations}</p>
          </div>
        )}

        {/* Treatment Plan */}
        {caseData.treatment_plan && (
          <div className="mb-3">
            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Management Plan</p>
            <p className="text-sm whitespace-pre-wrap">{caseData.treatment_plan}</p>
          </div>
        )}

        {/* IV Fluids */}
        {caseData.iv_fluid_plan && (
          <div className="mb-3">
            <p className="text-xs font-bold uppercase text-gray-600 mb-1">IV Fluids</p>
            <p className="text-sm whitespace-pre-wrap">{caseData.iv_fluid_plan}</p>
          </div>
        )}

        {!hasAny && (
          <p className="text-sm text-gray-500 italic">No plan or note has been generated for this case yet.</p>
        )}

        {/* Signature line */}
        <div className="mt-8 pt-4 border-t border-gray-300 grid grid-cols-2 gap-8">
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