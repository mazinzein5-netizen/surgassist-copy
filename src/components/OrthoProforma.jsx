import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Save, Check, X, AlertTriangle, Zap } from "lucide-react";

const PROFORMA_SECTIONS = [
  {
    title: "Key Clinical Queries",
    icon: Zap,
    items: [
      "Vomiting?",
      "Nausea?",
      "Fever?",
      "Numbness/tingling?",
      "Inability to bear weight?",
      "Visible deformity?",
    ],
  },
  {
    title: "Neurovascular Status",
    items: [
      "Distal pulses palpable?",
      "Sensation intact distally?",
      "Motor function intact?",
      "Capillary refill < 2s?",
    ],
  },
  {
    title: "Injury Assessment",
    items: [
      "Open fracture?",
      "Compartment syndrome signs?",
      "Vascular compromise?",
      "Neurological deficit?",
      "Skin integrity intact?",
    ],
  },
  {
    title: "Red Flags",
    icon: AlertTriangle,
    items: [
      "Head injury?",
      "Polytrauma?",
      "Sepsis signs?",
      "Airway compromise?",
    ],
  },
  {
    title: "PMH & Social",
    items: [
      "On anticoagulants?",
      "Diabetic?",
      "Smoker?",
      "Osteoporosis?",
      "Known allergies?",
    ],
  },
];

function buildInitialAnswers(existing) {
  const answers = {};
  for (const section of PROFORMA_SECTIONS) {
    for (const item of section.items) {
      const key = `${section.title}::${item}`;
      if (existing && existing[key]) {
        answers[key] = existing[key];
      } else {
        answers[key] = { answer: null, detail: "" };
      }
    }
  }
  return answers;
}

export function compileProformaLines(answers) {
  if (!answers) return [];
  const lines = [];
  for (const section of PROFORMA_SECTIONS) {
    const sectionLines = [];
    for (const item of section.items) {
      const key = `${section.title}::${item}`;
      const entry = answers[key];
      if (!entry || entry.answer === null) continue;
      const question = item.replace(/\?$/, "");
      if (entry.answer === "no") {
        sectionLines.push(`No ${question.toLowerCase()}`);
      } else if (entry.answer === "yes") {
        if (entry.detail?.trim()) {
          sectionLines.push(`${question}: ${entry.detail.trim()}`);
        } else {
          sectionLines.push(`${question} present`);
        }
      }
    }
    if (sectionLines.length > 0) {
      lines.push({ section: section.title, lines: sectionLines });
    }
  }
  return lines;
}

export default function OrthoProforma({ caseData, caseId, onUpdate }) {
  const [answers, setAnswers] = useState(() => buildInitialAnswers(caseData.proforma_data));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAnswers(buildInitialAnswers(caseData.proforma_data));
  }, [caseData.proforma_data]);

  const handleAnswer = (key, answer) => {
    setAnswers(prev => ({
      ...prev,
      [key]: { ...prev[key], answer: prev[key]?.answer === answer ? null : answer, detail: answer === "no" ? "" : prev[key]?.detail || "" },
    }));
  };

  const handleDetail = (key, detail) => {
    setAnswers(prev => ({
      ...prev,
      [key]: { ...prev[key], detail },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.CaseFile.update(caseId, {
        proforma_data: answers,
        status: "clerking",
      });
      onUpdate();
    } catch {
      alert("Failed to save proforma.");
    } finally {
      setSaving(false);
    }
  };

  const compiled = compileProformaLines(answers);
  const answeredCount = Object.values(answers).filter(a => a.answer !== null).length;
  const totalCount = Object.keys(answers).length;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Ortho Yes/No Proforma</h3>
          <span className="text-xs text-muted-foreground">{answeredCount}/{totalCount} answered</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-hive-gold text-hive-gold-foreground text-xs font-semibold hover:bg-hive-gold/90"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Proforma
        </button>
      </div>

      {/* Proforma sections */}
      {PROFORMA_SECTIONS.map((section) => {
        const SectionIcon = section.icon;
        return (
          <div key={section.title} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              {SectionIcon ? <SectionIcon className="w-4 h-4 text-hive-gold" /> : null}
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{section.title}</h4>
            </div>
            <div className="space-y-2.5">
              {section.items.map((item) => {
                const key = `${section.title}::${item}`;
                const entry = answers[key] || { answer: null, detail: "" };
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-foreground flex-1">{item}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleAnswer(key, "yes")}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            entry.answer === "yes"
                              ? "bg-destructive/15 text-destructive border border-destructive/30"
                              : "bg-secondary text-muted-foreground border border-border hover:text-foreground"
                          }`}
                        >
                          <Check className="w-3 h-3" /> Yes
                        </button>
                        <button
                          onClick={() => handleAnswer(key, "no")}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            entry.answer === "no"
                              ? "bg-success/15 text-success border border-success/30"
                              : "bg-secondary text-muted-foreground border border-border hover:text-foreground"
                          }`}
                        >
                          <X className="w-3 h-3" /> No
                        </button>
                      </div>
                    </div>
                    {entry.answer === "yes" && (
                      <input
                        type="text"
                        value={entry.detail}
                        onChange={(e) => handleDetail(key, e.target.value)}
                        placeholder="Brief detail..."
                        className="mt-1.5 w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Live compiled preview */}
      {compiled.length > 0 && (
        <div className="bg-card border-2 border-hive-gold/20 rounded-xl p-4">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Compiled Note Lines</h4>
          <div className="space-y-2">
            {compiled.map((group, gi) => (
              <div key={gi}>
                <p className="text-xs font-semibold text-accent">{group.section}</p>
                {group.lines.map((line, li) => (
                  <p key={li} className="text-sm text-foreground pl-3">- {line}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-4 py-3 rounded-lg bg-hive-gold text-hive-gold-foreground font-semibold text-sm hover:bg-hive-gold/90 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Proforma
      </button>
    </div>
  );
}