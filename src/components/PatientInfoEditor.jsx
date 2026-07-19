import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Loader2, X } from "lucide-react";
import SelectSheet from "@/components/SelectSheet";

const FIELDS = [
  { key: "patient_name", label: "Name", type: "text" },
  { key: "patient_dob", label: "DOB", type: "date" },
  { key: "patient_mrn", label: "MRN", type: "text" },
  { key: "patient_gender", label: "Gender", type: "select", options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }] },
  { key: "patient_address", label: "Address", type: "text", full: true },
  { key: "patient_phone", label: "Phone", type: "text" },
  { key: "patient_email", label: "Email", type: "text" },
  { key: "hospital", label: "Hospital", type: "text" },
  { key: "ward", label: "Ward", type: "text" },
  { key: "bed_number", label: "Bed", type: "text" },
  { key: "consultant_name", label: "Consultant", type: "text" },
  { key: "specialty", label: "Specialty", type: "text" },
  { key: "patient_status", label: "Status", type: "select", options: [{ value: "ed", label: "ED" }, { value: "outpatient", label: "Outpatient" }, { value: "inpatient", label: "Inpatient" }] },
];

export default function PatientInfoEditor({ caseData, onUpdate, onClose }) {
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({});

  useEffect(() => {
    setValues(Object.fromEntries(FIELDS.map(f => [f.key, caseData[f.key] || ""])));
  }, [caseData]);

  const update = (key, val) => setValues(prev => ({ ...prev, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.CaseFile.update(caseData.id, values);
      onUpdate();
      onClose?.();
    } catch {
      alert("Failed to save patient info.");
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {FIELDS.map(f => (
          <div key={f.key} className={f.full ? "sm:col-span-3" : ""}>
            <label className="text-xs text-muted-foreground block mb-0.5">{f.label}</label>
            {f.type === "select" ? (
              <SelectSheet
                value={values[f.key] || ""}
                options={[{ value: "", label: "—" }, ...f.options]}
                onChange={(v) => update(f.key, v)}
                label={f.label}
                placeholder="—"
              />
            ) : (
              <input
                type={f.type}
                value={values[f.key] || ""}
                onChange={(e) => update(f.key, e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
              />
            )}
          </div>
        ))}
      </div>
      <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hive-gold text-hive-gold-foreground text-xs font-semibold hover:bg-hive-gold/90 disabled:opacity-50">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
      </button>
    </div>
  );

  if (!onClose) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm">Edit Patient Details</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4">{content}</div>
      </div>
    </div>
  );
}