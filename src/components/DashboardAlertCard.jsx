import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock, BedDouble, Activity, ChevronRight } from "lucide-react";
import HexBadge from "@/components/HexBadge";

function scoreColor(score) {
  if (score >= 7) return "bg-destructive/20 text-destructive border-destructive/40";
  if (score >= 5) return "bg-warning/20 text-warning border-warning/40";
  if (score >= 3) return "bg-accent/20 text-accent border-accent/40";
  return "bg-success/20 text-success border-success/40";
}

export function INEWSAlertCard({ caseFile }) {
  const isCritical = caseFile.inews_score >= 7;
  return (
    <Link
      to={`/cases/${caseFile.id}`}
      className={`block bg-card border rounded-lg p-3 hover:border-hive-gold/30 transition-colors ${
        isCritical ? "border-destructive/40" : "border-warning/30"
      }`}
    >
      <div className="flex items-center gap-3">
        {isCritical && <AlertTriangle className="w-4 h-4 text-destructive animate-pulse-gold flex-shrink-0" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground text-sm truncate">{caseFile.patient_name || "Unknown"}</p>
            {caseFile.inews_score != null && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${scoreColor(caseFile.inews_score)}`}>
                INEWS {caseFile.inews_score}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
            {caseFile.ward && <span className="inline-flex items-center gap-0.5"><BedDouble className="w-2.5 h-2.5" />{caseFile.ward}</span>}
            <span className="truncate">{caseFile.presenting_complaint || caseFile.referral_summary || "No summary"}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    </Link>
  );
}

export function PendingReferralCard({ caseFile }) {
  const ageMin = Math.floor((new Date() - new Date(caseFile.created_date)) / 60000);
  const ageLabel = ageMin < 60 ? `${ageMin}m` : ageMin < 1440 ? `${Math.floor(ageMin / 60)}h` : `${Math.floor(ageMin / 1440)}d`;
  return (
    <Link
      to={`/cases/${caseFile.id}`}
      className="block bg-card border border-hive-gold/20 rounded-lg p-3 hover:border-hive-gold/40 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 hex-clip bg-hive-gold/10 flex items-center justify-center flex-shrink-0">
          <span className="text-hive-gold font-bold text-xs">{caseFile.patient_name?.charAt(0)?.toUpperCase() || "?"}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground text-sm truncate">{caseFile.patient_name || "Unknown"}</p>
            <HexBadge status={caseFile.status} />
          </div>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{caseFile.presenting_complaint || caseFile.referral_summary || "No summary"}</p>
        </div>
        <span className="inline-flex items-center gap-0.5 text-[10px] text-warning flex-shrink-0">
          <Clock className="w-2.5 h-2.5" />{ageLabel}
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    </Link>
  );
}