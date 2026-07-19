import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { BedDouble, Stethoscope, X, Loader2, Check } from "lucide-react";
import SelectSheet from "@/components/SelectSheet";

const DEPARTMENTS = [
  { value: "orthopaedics", label: "Orthopaedics" },
  { value: "general_surgery", label: "General Surgery" },
];

export default function InpatientStickerEditor({ caseData, onClose, onUpdated }) {
  const [department, setDepartment] = useState(caseData.department || "orthopaedics");
  const [ward, setWard] = useState(caseData.ward || "");
  const [bedNumber, setBedNumber] = useState(caseData.bed_number || "");
  const [consultantName, setConsultantName] = useState(caseData.consultant_name || "");
  const [diagnosis, setDiagnosis] = useState(caseData.diagnosis || "");
  const [diagnosisSeverity, setDiagnosisSeverity] = useState(caseData.diagnosis_severity || "none");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.CaseFile.update(caseData.id, {
        department,
        ward,
        bed_number: bedNumber,
        consultant_name: consultantName,
        diagnosis,
        diagnosis_severity: diagnosisSeverity,
      });
      onUpdated?.();
      onClose();
    } catch {
      alert("Failed to update patient details.");
    } finally {
      setSaving(false);
    }
  };

  const labelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wide";
  const inputClass = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-hive-gold" />
            <h3 className="font-semibold text-foreground text-sm">Edit Patient Details</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className={`${labelClass} block mb-1.5`}>Department</label>
            <SelectSheet value={department} options={DEPARTMENTS} onChange={setDepartment} label="Department" />
          </div>

          <div>
            <label className={`${labelClass} block mb-1.5`}>Consultant</label>
            <input value={consultantName} onChange={e => setConsultantName(e.target.value)}
              placeholder="e.g. Mr. O'Brien"
              className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`${labelClass} block mb-1.5`}>Ward</label>
              <input value={ward} onChange={e => setWard(e.target.value)}
                placeholder="e.g. St. John's"
                className={inputClass} />
            </div>
            <div>
              <label className={`${labelClass} block mb-1.5`}>Bed No.</label>
              <input value={bedNumber} onChange={e => setBedNumber(e.target.value)}
                placeholder="e.g. 12"
                className={inputClass} />
            </div>
          </div>

          <div>
            <label className={`${labelClass} block mb-1.5`}>Diagnosis</label>
            <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
              placeholder="e.g. #Right NOF fracture"
              className={inputClass} />
          </div>

          <div>
            <label className={`${labelClass} block mb-1.5`}>Severity</label>
            <SelectSheet value={diagnosisSeverity} options={[{ value: "none", label: "Not Set" }, { value: "low", label: "Low" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High" }, { value: "critical", label: "Critical" }]} onChange={setDiagnosisSeverity} label="Severity" />
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-muted text-muted-foreground text-sm font-semibold hover:bg-muted/80">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-lg bg-hive-gold text-hive-navy text-sm font-semibold hover:bg-hive-gold/90 flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}