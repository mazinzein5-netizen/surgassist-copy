import React from "react";
import { Link } from "react-router-dom";
import StatusPill from "@/components/StatusPill";
import { formatTimestamp, timeAgo, getStage } from "@/lib/workflow";
import { isReferralIncomplete, isAwaitingAction, getAwaitingReason, SEVERITY_COLORS, DISCHARGE_PATHWAY_LABELS } from "@/lib/referralStatus";
import { ChevronRight, Check, ClipboardCheck, BedDouble, Pencil, UserCog, AlertTriangle, FlaskConical } from "lucide-react";

const DEPT_LABELS = {
  orthopaedics: "Orthopaedics",
  general_surgery: "General Surgery",
};

export default function CaseCard({ caseData: c, onEdit, mode = "referral" }) {
  const incomplete = mode === "referral" && isReferralIncomplete(c);
  const awaiting = mode === "referral" && isAwaitingAction(c);
  const awaitingReason = awaiting ? getAwaitingReason(c) : null;
  const stage = getStage(c);
  const sevColor = SEVERITY_COLORS[c.diagnosis_severity] || null;

  const cardClass = [
    "block bg-card border rounded-xl p-4 transition-colors",
    awaiting
      ? "border-red-500/60 animate-border-blink-red"
      : incomplete
      ? "bg-pink-500/5 border-pink-500/60 animate-border-blink-pink"
      : "border-border hover:border-hive-gold/40",
  ].join(" ");

  const timeClass = awaiting
    ? "text-red-500 font-bold animate-text-blink-red"
    : "text-muted-foreground";

  return (
    <Link to={`/cases/${c.id}`} className={cardClass}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Name + MRN */}
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground truncate">{c.patient_name || "Unknown"}</p>
            {c.patient_mrn && <span className="text-sm font-semibold text-muted-foreground">MRN: {c.patient_mrn}</span>}
          </div>

          {/* Presenting complaint */}
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {c.presenting_complaint || c.referral_summary || "No complaint recorded"}
          </p>

          {/* Diagnosis (referral mode) */}
          {mode === "referral" && c.diagnosis && (
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold"
                style={sevColor ? {
                  backgroundColor: `${sevColor}15`,
                  color: sevColor,
                  border: `1px solid ${sevColor}40`,
                } : {
                  backgroundColor: "hsl(var(--muted))",
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                {c.diagnosis}
              </span>
            </div>
          )}

          {/* Treatment plan */}
          {c.treatment_plan && (
            <div className="flex items-center gap-1.5 mt-1">
              <ClipboardCheck className="w-3 h-3 text-hive-gold flex-shrink-0" />
              <p className="text-xs text-hive-gold font-medium truncate">
                {c.treatment_plan.split("\n")[0].slice(0, 80)}
              </p>
            </div>
          )}

          {/* Awaiting alert */}
          {awaiting && (
            <div className="flex items-center gap-1.5 mt-1">
              <FlaskConical className="w-3 h-3 text-red-500 animate-text-blink-red" />
              <p className="text-xs text-red-500 font-semibold">{awaitingReason}</p>
            </div>
          )}

          {/* Incomplete alert */}
          {incomplete && !awaiting && (
            <div className="flex items-center gap-1.5 mt-1">
              <AlertTriangle className="w-3 h-3 text-pink-500" />
              <p className="text-xs text-pink-500 font-semibold">Incomplete referral info</p>
            </div>
          )}

          {/* Badges row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Department sticker (clickable) */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(c); }}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer hover:ring-2 hover:ring-hive-gold/40 transition-all ${
                c.department === "orthopaedics"
                  ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                  : c.department === "general_surgery"
                  ? "bg-teal-500/15 text-teal-400 border border-teal-500/20"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
              title="Edit department, ward, bed, consultant, diagnosis"
            >
              {DEPT_LABELS[c.department] || c.department?.replace(/_/g, " ") || "Unknown"}
              <Pencil className="w-2.5 h-2.5 opacity-60" />
            </button>

            <StatusPill caseData={c} />

            {/* Inpatient: consultant */}
            {mode === "inpatient" && c.consultant_name && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                <UserCog className="w-3 h-3" /> {c.consultant_name}
              </span>
            )}

            {/* Inpatient: ward/bed */}
            {mode === "inpatient" && (c.ward || c.bed_number) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-hive-gold/15 text-hive-gold border border-hive-gold/30">
                <BedDouble className="w-3 h-3" />
                {c.ward || "Ward"}{c.bed_number ? ` · Bed ${c.bed_number}` : ""}
              </span>
            )}

            {/* Discharged: pathway */}
            {mode === "discharged" && c.discharge_pathway && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-green-500/15 text-green-400 border border-green-500/20">
                <Check className="w-3 h-3" /> {DISCHARGE_PATHWAY_LABELS[c.discharge_pathway] || c.discharge_pathway}
              </span>
            )}

            <span className={`text-xs ${timeClass}`}>{timeAgo(c.created_date)}</span>
            <span className={`text-xs ${timeClass}`}>{formatTimestamp(c.created_date)}</span>
          </div>
        </div>

        {/* Right side: stage indicator */}
        <div className="flex-shrink-0">
          {stage < 3 ? (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              stage === 0 ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"
            }`}>
              {stage === 0 ? "Triage" : stage === 1 ? "Review" : "Plan"}
              <ChevronRight className="w-3 h-3" />
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/15 text-green-400">
              <Check className="w-3 h-3" /> Discharged
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}