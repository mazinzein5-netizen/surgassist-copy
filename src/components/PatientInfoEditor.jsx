import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Loader2 } from "lucide-react";

const FIELDS = [
  { key: "patient_name", label: "Name", type: "text" },
  { key: "patient_dob", label: "DOB", type: "date" },
  { key: "patient_mrn", label: "MRN", type: "text" },
  { key: "patient_gender", label: "Gender", type: "select", options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }] },
  { key: "hospital", label: "Hospital", type: "text" },
  { key: "ward", label: "Ward", type: "text" },
  { key: "bed_number", label: "Bed", type: "text" },
  { key: "consultant_name", label: "Consultant", type: "text" },
  { key: "specialty", label: "Specialty", type: "text" },
  { key: "patient_status", label: "Status", type: "select", options: [{ value: "ed", label: "ED" }, { value: "outpatient", label: "Outpatient" }, { value: "inpatient", label: "Inpatient" }] },
];

export default function PatientInfoEditor({ caseData, onUpdate }) {
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
    } catch {
      alert("Failed to save patient info.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {FIELDS.map(f => (
          <div key={f.key}>
            <label className="text-xs text-muted-foreground block mb-0.5">{f.label}</label>
            {f.type === "select" ? (
              <select
                value={values[f.key] || ""}
                onChange={(e) => update(f.key, e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
              >
                <option value="">—</option>
                {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
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
}