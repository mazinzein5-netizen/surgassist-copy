import React from "react";
import { User, MapPin, Stethoscope, Building2 } from "lucide-react";

export default function InpatientProformaHeader({ caseData }) {
  const specialty = caseData.specialty || (caseData.department === "general_surgery" ? "General Surgery" : "Orthopaedics");

  return (
    <div className="bg-card border-2 border-hive-gold/30 rounded-xl p-4">
      <h3 className="text-sm font-bold text-hive-gold uppercase tracking-wide mb-3">Inpatient Proforma</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <InfoBlock icon={User} label="Patient" value={caseData.patient_name} />
        <InfoBlock icon={User} label="MRN" value={caseData.patient_mrn || "—"} />
        <InfoBlock icon={User} label="DOB" value={caseData.patient_dob ? new Date(caseData.patient_dob).toLocaleDateString("en-IE") : "—"} />
        <InfoBlock icon={MapPin} label="Bed" value={caseData.bed_number || "—"} />
        <InfoBlock icon={MapPin} label="Ward" value={caseData.ward || "—"} />
        <InfoBlock icon={Building2} label="Specialty" value={specialty} />
        {caseData.consultant_name && (
          <InfoBlock icon={Stethoscope} label="Consultant" value={caseData.consultant_name} />
        )}
      </div>

      {(caseData.on_call_consultant || caseData.on_call_registrar || caseData.on_call_sho) && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">On-Call Team at Referral</p>
          <div className="flex flex-wrap gap-3 text-xs">
            {caseData.on_call_consultant && (
              <span className="text-foreground"><span className="text-muted-foreground">Consultant:</span> {caseData.on_call_consultant}</span>
            )}
            {caseData.on_call_registrar && (
              <span className="text-foreground"><span className="text-muted-foreground">Registrar:</span> {caseData.on_call_registrar}</span>
            )}
            {caseData.on_call_sho && (
              <span className="text-foreground"><span className="text-muted-foreground">SHO:</span> {caseData.on_call_sho}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBlock({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm text-foreground font-medium">{value}</p>
    </div>
  );
}