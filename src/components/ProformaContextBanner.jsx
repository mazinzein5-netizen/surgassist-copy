import React from "react";
import { Activity, MapPin, Calendar, Stethoscope, AlertCircle } from "lucide-react";

const STATUS_CONFIG = {
  ed: { label: "Emergency Department", tone: "bg-destructive/15 text-destructive border-destructive/30" },
  outpatient: { label: "Outpatient", tone: "bg-primary/15 text-primary border-primary/30" },
  inpatient: { label: "Inpatient", tone: "bg-hive-gold/15 text-hive-gold border-hive-gold/30" },
};

const PRE_OP_LABELS = {
  not_listed: "Not listed for theatre",
  listed: "Listed for theatre",
  in_theatre: "In theatre",
  post_op: "Post-op",
  not_applicable: "N/A",
};

export default function ProformaContextBanner({ caseData }) {
  const status = STATUS_CONFIG[caseData.patient_status] || null;
  const complaint = caseData.presenting_complaint || caseData.referral_summary || "—";
  const specialty = caseData.specialty || (caseData.department === "general_surgery" ? "General Surgery" : "Orthopaedics");
  const isPostOp = caseData.pre_op_status === "post_op";
  const isDayOfSurgery = caseData.pre_op_status === "listed" || caseData.pre_op_status === "in_theatre";
  const procedureDate = caseData.procedure_date ? new Date(caseData.procedure_date).toLocaleDateString("en-IE") : null;
  const pod = caseData.pod;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tailored Proforma Context</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Patient status badge */}
        {status && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border ${status.tone}`}>
            <MapPin className="w-3 h-3" /> {status.label}
          </span>
        )}
        {/* Day of surgery / post-op badge */}
        {(isDayOfSurgery || isPostOp) && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border ${
            isPostOp ? "bg-success/15 text-success border-success/30" : "bg-warning/15 text-warning border-warning/30"
          }`}>
            <Calendar className="w-3 h-3" />
            {isPostOp ? `POD ${pod ?? "—"}` : "Day of Surgery"}
          </span>
        )}
        {/* Specialty badge */}
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-border">
          <Stethoscope className="w-3 h-3" /> {specialty}
        </span>
      </div>

      {/* Presenting complaint */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Presenting Complaint</p>
        <p className="text-sm text-foreground">{complaint}</p>
      </div>

      {/* Procedure info if applicable */}
      {(procedureDate || caseData.procedure_name) && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {caseData.procedure_name && (
            <span><Activity className="w-3 h-3 inline mr-1" /> {caseData.procedure_name}</span>
          )}
          {procedureDate && (
            <span><Calendar className="w-3 h-3 inline mr-1" /> {procedureDate}</span>
          )}
        </div>
      )}

      {/* Tailoring note */}
      {(isPostOp || isDayOfSurgery) && (
        <div className="flex items-start gap-1.5 px-3 py-2 bg-warning/5 rounded-lg border border-warning/15">
          <AlertCircle className="w-3.5 h-3.5 text-warning mt-0.5 flex-shrink-0" />
          <p className="text-xs text-warning-foreground">
            {isPostOp
              ? "Post-operative assessment — focus on wound site, neurovascular status, analgesia adequacy, mobilisation, and signs of complications."
              : "Day of surgery — confirm NBM status, site marking, consent, and optimisation for theatre."}
          </p>
        </div>
      )}
    </div>
  );
}