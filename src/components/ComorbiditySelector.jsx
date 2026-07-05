import React, { useState } from "react";
import { Check, X, ChevronDown, ChevronUp, Zap } from "lucide-react";

const TOP_10 = [
  "T2DM",
  "Hypertension",
  "Atrial Fibrillation",
  "IHD",
  "CKD",
  "COPD",
  "Dementia",
  "Frailty",
  "Anticoagulated",
  "Steroid-dependent",
];

const FULL_LIST = [
  "Type 1 DM", "Heart Failure", "Asthma", "OSA", "Parkinson's",
  "Stroke/TIA", "Cirrhosis", "PUD", "IBD", "Hypothyroid",
  "Osteoporosis", "Active Cancer", "Immunosuppressed", "Smoker",
  "Ex-smoker", "Alcohol excess", "Obesity",
];

export default function ComorbiditySelector({ selected, onToggle, onClearAll, onSelectAll }) {
  const [showFull, setShowFull] = useState(false);
  const all = [...TOP_10, ...FULL_LIST];
  const allSelected = all.every(c => selected.includes(c));
  const noneSelected = all.every(c => !selected.includes(c));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-muted-foreground">Key Comorbidities</label>
        <div className="flex items-center gap-1">
          <button
            onClick={onSelectAll}
            disabled={allSelected}
            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 disabled:opacity-30 transition-colors"
          >
            All Yes
          </button>
          <button
            onClick={onClearAll}
            disabled={noneSelected}
            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-success/10 text-success border border-success/20 hover:bg-success/20 disabled:opacity-30 transition-colors"
          >
            All No
          </button>
        </div>
      </div>

      {/* Top 10 rapid-entry grid */}
      <div className="mb-2">
        <div className="flex items-center gap-1 mb-1.5">
          <Zap className="w-3 h-3 text-hive-gold" />
          <span className="text-[10px] font-bold text-hive-gold uppercase tracking-wider">Top 10 — Rapid Entry</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {TOP_10.map(c => {
            const active = selected.includes(c);
            return (
              <button
                key={c}
                onClick={() => onToggle(c)}
                className={`flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? "bg-hive-gold/20 text-hive-gold border border-hive-gold/40"
                    : "bg-secondary text-muted-foreground border border-border hover:text-foreground"
                }`}
              >
                {active ? <Check className="w-3 h-3 flex-shrink-0" /> : <X className="w-3 h-3 flex-shrink-0 opacity-30" />}
                <span className="truncate">{c}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full list toggle */}
      <button
        onClick={() => setShowFull(!showFull)}
        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground mb-2"
      >
        {showFull ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {showFull ? "Hide" : "Show"} full comorbidity list ({FULL_LIST.length} more)
      </button>

      {showFull && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {FULL_LIST.map(c => {
            const active = selected.includes(c);
            return (
              <button
                key={c}
                onClick={() => onToggle(c)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  active
                    ? "bg-hive-gold/15 text-hive-gold border border-hive-gold/30"
                    : "bg-secondary text-muted-foreground border border-border hover:text-foreground"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}