import React from "react";
import { ClipboardList, Stethoscope, FlaskConical, CheckCircle2 } from "lucide-react";

const CATEGORIES = [
  { key: "history", label: "History", icon: ClipboardList, color: "text-accent", border: "border-accent/30", bg: "bg-accent/10" },
  { key: "exam_findings", label: "Exam Findings", icon: Stethoscope, color: "text-success", border: "border-success/30", bg: "bg-success/10" },
  { key: "investigations_imaging", label: "Investigations / Imaging", icon: FlaskConical, color: "text-hive-gold", border: "border-hive-gold/30", bg: "bg-hive-gold/10" },
];

export default function RequiredInfoChecklist({ requiredInfo }) {
  if (!requiredInfo) return null;
  const hasAny = CATEGORIES.some(c => requiredInfo[c.key]?.length > 0);
  if (!hasAny) {
    return (
      <div className="mt-3 flex items-center gap-2 text-xs text-success">
        <CheckCircle2 className="w-4 h-4" />
        <span>All key information collected for triage.</span>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Required Info</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const items = requiredInfo[cat.key] || [];
          const Icon = cat.icon;
          return (
            <div key={cat.key} className={`rounded-lg border ${cat.border} ${cat.bg} p-3`}>
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                <span className={`text-xs font-bold ${cat.color}`}>{cat.label}</span>
                {items.length > 0 && (
                  <span className="ml-auto text-[10px] font-medium text-muted-foreground">{items.length}</span>
                )}
              </div>
              {items.length > 0 ? (
                <ul className="space-y-1">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                      <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${cat.color.replace("text-", "bg-")}`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">No items needed</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}