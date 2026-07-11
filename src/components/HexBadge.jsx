import React from "react";

const STATUS_CONFIG = {
  referral_intake: { label: "Pending", tone: "amber" },
  triage: { label: "Triaging", tone: "amber" },
  accepted: { label: "Accepted", tone: "red" },
  declined: { label: "Declined", tone: "neutral" },
  clerking: { label: "Clerking", tone: "amber" },
  investigations: { label: "Investigations", tone: "amber" },
  admitted: { label: "Admitted", tone: "amber" },
  discharge_ready: { label: "Ready", tone: "green" },
  discharged: { label: "Discharged", tone: "green" },
  inews_consult: { label: "INEWS", tone: "red" },
  pending: { label: "Pending", tone: "amber" },
  reviewed: { label: "Reviewed", tone: "neutral" },
  countersigned: { label: "Signed", tone: "green" },
};

const TONE_STYLES = {
  red: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/25",
  amber: "bg-[#D97706]/10 text-[#D97706] border-[#D97706]/25",
  green: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/25",
  neutral: "bg-muted text-muted-foreground border-border",
};

export default function HexBadge({ status, label, className = "" }) {
  const config = STATUS_CONFIG[status] || { label: label || status, tone: "neutral" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${TONE_STYLES[config.tone]} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {config.label}
    </span>
  );
}