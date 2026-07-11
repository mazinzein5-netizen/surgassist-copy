import React from "react";
import { COLOR_HEX, getStatusColor } from "@/lib/workflow";

const STATUS_LABELS = {
  referral_intake: "Referral",
  triage: "Triaging",
  accepted: "Accepted",
  declined: "Declined",
  clerking: "Clerking",
  investigations: "Investigations",
  admitted: "Admitted",
  discharged: "Discharged",
  inews_consult: "INEWS Consult",
  discharge_ready: "Discharge Ready",
};

export default function StatusPill({ caseData, size = "sm" }) {
  const color = getStatusColor(caseData);
  const hex = COLOR_HEX[color];
  const label = STATUS_LABELS[caseData.status] || caseData.status?.replace(/_/g, " ") || "Unknown";
  const padding = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${padding}`}
      style={{ backgroundColor: `${hex}15`, color: hex, border: `1px solid ${hex}30` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hex }} />
      {label}
    </span>
  );
}