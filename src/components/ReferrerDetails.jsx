import React, { useState } from "react";
import { UserRound, Phone, ChevronDown, ChevronUp } from "lucide-react";

const GRADES = [
  { value: "intern", label: "Intern" },
  { value: "sho", label: "SHO" },
  { value: "registrar", label: "Registrar" },
  { value: "consultant", label: "Consultant" },
  { value: "nursing", label: "Nursing" },
  { value: "other", label: "Other" },
];

export default function ReferrerDetails({ value, onChange }) {
  const update = (field, val) => onChange({ ...value, [field]: val });
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full mb-0 text-left"
      >
        <UserRound className="w-4 h-4 text-hive-gold flex-shrink-0" />
        <h3 className="font-semibold text-foreground text-sm flex-1">Referrer Details</h3>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Referrer Name</label>
          <input
            type="text"
            value={value.referrer_name || ""}
            onChange={(e) => update("referrer_name", e.target.value)}
            placeholder="e.g. Dr. Sarah O'Brien"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Grade</label>
          <select
            value={value.referrer_grade || ""}
            onChange={(e) => update("referrer_grade", e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
          >
            <option value="">Select grade…</option>
            {GRADES.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Department / Team</label>
          <input
            type="text"
            value={value.referrer_department || ""}
            onChange={(e) => update("referrer_department", e.target.value)}
            placeholder="e.g. ED, Ward 3B, ICU"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1">
            <Phone className="w-3 h-3" /> Direct Contact
          </label>
          <input
            type="text"
            value={value.referrer_contact || ""}
            onChange={(e) => update("referrer_contact", e.target.value)}
            placeholder="Phone / WhatsApp / Extension"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
          />
        </div>
      </div>
      )}
    </div>
  );
}