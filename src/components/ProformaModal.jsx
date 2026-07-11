import React from "react";
import { X } from "lucide-react";
import OrthoProforma from "@/components/OrthoProforma";

export default function ProformaModal({ caseData, caseId, onClose, onUpdate }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl my-8" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
          <div>
            <h2 className="font-bold text-gray-900 text-sm">Clinical Proforma</h2>
            <p className="text-xs text-gray-500">{caseData.patient_name}{caseData.patient_mrn ? ` · MRN: ${caseData.patient_mrn}` : ""}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <OrthoProforma caseData={caseData} caseId={caseId} onUpdate={onUpdate} />
        </div>
      </div>
    </div>
  );
}