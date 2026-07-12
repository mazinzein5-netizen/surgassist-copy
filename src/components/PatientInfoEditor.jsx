import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Pencil, Check, X, Loader2 } from "lucide-react";

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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({});

  const startEdit = () => {
    setValues(Object.fromEntries(FIELDS.map(f => [f.key, caseData[f.key] || ""])));
    setEditing(true);
  };

  const cancel = () => { setEditing(false); setValues({}); };

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.CaseFile.update(caseData.id, values);
      setEditing(false);
      onUpdate();
    } catch {
      alert("Failed to save patient info.");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FIELDS.map(f => (
            <div key={f.key}>
              <label className="text-xs text-muted-foreground block mb-0.5">{f.label}</label>
              {f.type === "select" ? (
                <select
                  value={values[f.key] || ""}
                  onChange={(e) => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
                >
                  <option value="">—</option>
                  {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input
                  type={f.type}
                  value={values[f.key] || ""}
                  onChange={(e) => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hive-gold text-hive-gold-foreground text-xs font-semibold hover:bg-hive-gold/90 disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
          </button>
          <button onClick={cancel} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 disabled:opacity-50">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {FIELDS.map(f => {
          let val = caseData[f.key];
          if (f.key === "patient_dob" && val) val = new Date(val).toLocaleDateString("en-GB");
          if (f.key === "patient_gender" && val) val = val.charAt(0).toUpperCase() + val.slice(1);
          if (f.key === "patient_status" && val) val = val.toUpperCase();
          return (
            <div key={f.key}>
              <p className="text-sm text-muted-foreground">{f.label}</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{val || "—"}</p>
            </div>
          );
        })}
      </div>
      <button onClick={startEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80">
        <Pencil className="w-3.5 h-3.5" /> Edit
      </button>
    </div>
  );
}