import React from "react";

const STATUS_CONFIG = {
  referral_intake: { label: "Referral", color: "bg-accent/15 text-accent border-accent/30" },
  triage: { label: "Triaging", color: "bg-warning/15 text-warning border-warning/30" },
  accepted: { label: "Accepted", color: "bg-success/15 text-success border-success/30" },
  declined: { label: "Declined", color: "bg-destructive/15 text-destructive border-destructive/30" },
  clerking: { label: "Clerking", color: "bg-accent/15 text-accent border-accent/30" },
  investigations: { label: "Investigations", color: "bg-accent/15 text-accent border-accent/30" },
  admitted: { label: "Admitted", color: "bg-success/15 text-success border-success/30" },
  discharged: { label: "Discharged", color: "bg-muted text-muted-foreground border-border" },
  inews_consult: { label: "INEWS Consult", color: "bg-destructive/15 text-destructive border-destructive/30" },
  pending: { label: "Pending", color: "bg-warning/15 text-warning border-warning/30" },
  reviewed: { label: "Reviewed", color: "bg-accent/15 text-accent border-accent/30" },
  countersigned: { label: "Countersigned", color: "bg-success/15 text-success border-success/30" },
};

export default function HexBadge({ status, label, className = "" }) {
  const config = STATUS_CONFIG[status] || { label: label || status, color: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.color} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {config.label}
    </span>
  );
}