import React from "react";
import { AlertTriangle, ShieldAlert, Activity, Pill, Brain, Clock } from "lucide-react";
import { generatePeriopAlerts, getSeverityColor } from "@/lib/periopAlerts";

const SEVERITY_STYLES = {
  critical: {
    bg: "bg-destructive/10",
    border: "border-destructive/40",
    icon: "text-destructive",
    label: "CRITICAL",
    labelBg: "bg-destructive text-destructive-foreground",
  },
  high: {
    bg: "bg-destructive/5",
    border: "border-destructive/30",
    icon: "text-destructive",
    label: "HIGH RISK",
    labelBg: "bg-destructive/80 text-destructive-foreground",
  },
  medium: {
    bg: "bg-warning/10",
    border: "border-warning/40",
    icon: "text-warning",
    label: "CAUTION",
    labelBg: "bg-warning text-warning-foreground",
  },
  low: {
    bg: "bg-accent/5",
    border: "border-accent/30",
    icon: "text-accent",
    label: "INFO",
    labelBg: "bg-accent text-accent-foreground",
  },
};

const CATEGORY_ICONS = {
  "Anticoagulation / Antiplatelet": Pill,
  "Corticosteroid": ShieldAlert,
  "Diabetes Management": Activity,
  "Delirium Risk": Brain,
  "Geriatric Risk": Brain,
  "Fasting Status": Clock,
};

export default function PeriopAlertsPanel({ meds = [], comorbidities = "", caseData = {} }) {
  const alerts = generatePeriopAlerts(meds, comorbidities, caseData);

  if (alerts.length === 0) {
    return (
      <div className="bg-success/5 border border-success/20 rounded-xl p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center">
          <span className="text-success text-sm">✓</span>
        </div>
        <div>
          <p className="text-sm font-medium text-success">No perioperative alerts</p>
          <p className="text-xs text-muted-foreground">No high-risk medications or conditions detected. Continue standard perioperative care.</p>
        </div>
      </div>
    );
  }

  const criticalCount = alerts.filter(a => a.severity === "critical" || a.severity === "high").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <h3 className="text-sm font-bold text-foreground">Perioperative Safety Alerts</h3>
        {criticalCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
            {criticalCount} HIGH PRIORITY
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Auto-classified per RCSEng, RCSI, NICE NG45, AAGBI, ERAS & BOA perioperative protocols
      </p>

      {alerts.map((alert, i) => {
        const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium;
        const CatIcon = CATEGORY_ICONS[alert.category] || AlertTriangle;

        return (
          <div key={i} className={`${style.bg} border ${style.border} rounded-xl p-4`}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <CatIcon className={`w-4 h-4 ${style.icon} flex-shrink-0`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{alert.category}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${style.labelBg}`}>
                {style.label}
              </span>
            </div>

            <h4 className="text-sm font-bold text-purple-900 mb-1">{alert.title}</h4>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{alert.detail}</p>

            {alert.action && (
              <div className="bg-background/50 rounded-lg p-3 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Required Action</p>
                <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{alert.action}</p>
              </div>
            )}

            {alert.timeline && (
              <div className="mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Timeline</p>
                <p className="text-xs text-foreground">{alert.timeline}</p>
              </div>
            )}

            {alert.monitoring && (
              <div className="mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Monitoring</p>
                <p className="text-xs text-foreground">{alert.monitoring}</p>
              </div>
            )}

            {alert.source && (
              <p className="text-[10px] text-muted-foreground italic mt-2">
                Source: {alert.source}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}