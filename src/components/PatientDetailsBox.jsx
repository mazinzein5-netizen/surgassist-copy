import React, { useState } from "react";
import { User, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export default function PatientDetailsBox({ value, onChange, autoFilled }) {
  const [open, setOpen] = useState(true);
  const update = (field, val) => onChange({ ...value, [field]: val });

  const filledCount = ["patient_name", "patient_dob", "patient_mrn", "patient_gender"].filter(
    (f) => value[f]
  ).length;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full text-left"
      >
        <User className="w-4 h-4 text-hive-gold flex-shrink-0" />
        <h3 className="font-semibold text-foreground text-sm flex-1">Patient Details</h3>
        {autoFilled && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-hive-gold bg-hive-gold/10 px-2 py-0.5 rounded-full border border-hive-gold/20">
            <Sparkles className="w-3 h-3" /> Auto-filled
          </span>
        )}
        <span className="text-[10px] text-muted-foreground">{filledCount}/4</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Patient Name</label>
            <input
              type="text"
              value={value.patient_name || ""}
              onChange={(e) => update("patient_name", e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Date of Birth</label>
            <input
              type="date"
              value={value.patient_dob || ""}
              onChange={(e) => update("patient_dob", e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">MRN</label>
            <input
              type="text"
              value={value.patient_mrn || ""}
              onChange={(e) => update("patient_mrn", e.target.value)}
              placeholder="Medical Record Number"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Gender</label>
            <select
              value={value.patient_gender || ""}
              onChange={(e) => update("patient_gender", e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
            >
              <option value="">Select…</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}