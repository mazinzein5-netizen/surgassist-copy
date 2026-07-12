import React from "react";
import { BedDouble, UserCheck, Stethoscope, Activity } from "lucide-react";

const STATUS_OPTIONS = [
  {
    id: "ed",
    label: "ED Patient",
    desc: "New presentation from Emergency Department",
    icon: Activity,
  },
  {
    id: "outpatient",
    label: "Outpatient",
    desc: "Clinic or referred from primary care",
    icon: UserCheck,
  },
  {
    id: "inpatient",
    label: "Inpatient",
    desc: "Already admitted — select department & consultant",
    icon: BedDouble,
  },
];

export default function PatientStatusSelector({ value, onChange }) {
  const { patientStatus, inpatientDepartment, inpatientConsultant } = value || {};

  const handleSelect = (statusId) => {
    onChange({
      patientStatus: statusId,
      inpatientDepartment: statusId === "inpatient" ? inpatientDepartment || "" : "",
      inpatientConsultant: statusId === "inpatient" ? inpatientConsultant || "" : "",
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Stethoscope className="w-4 h-4 text-hive-gold" />
        <h3 className="text-sm font-semibold text-foreground">Patient Status</h3>
        <span className="text-xs text-muted-foreground">— where is the patient now?</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        {STATUS_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const selected = patientStatus === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`flex flex-col items-start p-3 rounded-lg border text-left transition-colors ${
                selected
                  ? "bg-hive-gold/10 border-hive-gold/50"
                  : "bg-background border-border hover:border-hive-gold/30"
              }`}
            >
              <Icon className={`w-4 h-4 mb-1.5 ${selected ? "text-hive-gold" : "text-muted-foreground"}`} />
              <span className={`text-sm font-semibold ${selected ? "text-foreground" : "text-muted-foreground"}`}>
                {opt.label}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">{opt.desc}</span>
            </button>
          );
        })}
      </div>

      {patientStatus === "inpatient" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-slide-up">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Treating Department</label>
            <select
              value={inpatientDepartment || ""}
              onChange={(e) => onChange({ ...value, inpatientDepartment: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
            >
              <option value="">Select department...</option>
              <option value="orthopaedics">Orthopaedics</option>
              <option value="general_surgery">General Surgery</option>
              <option value="ent">ENT</option>
              <option value="urology">Urology</option>
              <option value="vascular">Vascular</option>
              <option value="plastics">Plastics</option>
              <option value="medicine">General Medicine</option>
              <option value="cardiology">Cardiology</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Treating Consultant</label>
            <input
              type="text"
              value={inpatientConsultant || ""}
              onChange={(e) => onChange({ ...value, inpatientConsultant: e.target.value })}
              placeholder="e.g. Mr/Ms Smith"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
            />
          </div>
        </div>
      )}
    </div>
  );
}