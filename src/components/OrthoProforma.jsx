import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Save, Check, X, AlertTriangle, Zap, Sparkles, CheckCheck } from "lucide-react";
import { detectBodyRegion, getGenericStatement } from "@/lib/genericStatements";
import AnticoagulantSelector, { formatAnticoagulants } from "@/components/AnticoagulantSelector";
import DiabeticMedSelector, { formatDiabeticMeds } from "@/components/DiabeticMedSelector";
import PatientInfoEditor from "@/components/PatientInfoEditor";

const ORTHO_SECTIONS = [
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

const GEN_SURG_SECTIONS = [
  {
    title: "Key Clinical Queries",
    icon: Zap,
    items: [
      "Vomiting?",
      "Nausea?",
      "Fever?",
      "Jaundice?",
      "Bowel changes?",
      "Abdominal distension?",
    ],
  },
  {
    title: "Abdominal Examination",
    items: [
      "Abdomen soft and non-tender?",
      "Guarding?",
      "Rigidity?",
      "Rebound tenderness?",
      "Bowel sounds present?",
      "Palpable mass?",
      "Murphy sign?",
      "Rovsing sign?",
      "Psoas sign?",
      "Hernia orifices intact?",
    ],
  },
  {
    title: "Red Flags",
    icon: AlertTriangle,
    items: [
      "Peritonitis signs?",
      "Sepsis signs?",
      "Bowel obstruction signs?",
      "Airway compromise?",
    ],
  },
  {
    title: "PMH & Social",
    items: [
      "On anticoagulants?",
      "Diabetic?",
      "Smoker?",
      "Known allergies?",
      "Previous abdominal surgery?",
    ],
  },
];

function getSections(department) {
  return department === "general_surgery" ? GEN_SURG_SECTIONS : ORTHO_SECTIONS;
}

function buildInitialAnswers(existing, department) {
  const sections = getSections(department);
  const answers = {};
  for (const section of sections) {
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

export function compileProformaLines(answers, caseData) {
  if (!answers) return [];
  const department = caseData?.department;
  const bodyRegion = detectBodyRegion(
    `${caseData?.presenting_complaint || ""} ${caseData?.referral_summary || ""} ${caseData?.mechanism_of_injury || ""}`
  );

  const lines = [];
  const sections = getSections(department);

  for (const section of sections) {
    const sectionLines = [];
    for (const item of section.items) {
      const key = `${section.title}::${item}`;
      const entry = answers[key];
      if (!entry || entry.answer === null) continue;

      const question = item.replace(/\?$/, "");

      // Special handling for anticoagulants — use meds array with classification
      if (question.toLowerCase() === "on anticoagulants") {
        if (entry.answer === "no") {
          sectionLines.push("Not on anticoagulants");
        } else if (entry.answer === "yes") {
          const formatted = formatAnticoagulants(entry.meds);
          sectionLines.push(formatted || "On anticoagulation (type and dose to be documented)");
        }
        continue;
      }

      // Special handling for diabetic medications
      if (question.toLowerCase() === "diabetic") {
        if (entry.answer === "no") {
          sectionLines.push("Non-diabetic");
        } else if (entry.answer === "yes") {
          const formatted = formatDiabeticMeds(entry.meds);
          sectionLines.push(formatted || "Diabetic (medications to be documented)");
        }
        continue;
      }

      if (entry.detail?.trim()) {
        // User provided detail — use it
        if (entry.answer === "no") {
          sectionLines.push(`No ${question.toLowerCase()}`);
        } else {
          sectionLines.push(`${question}: ${entry.detail.trim()}`);
        }
      } else {
        // No detail — try generic statement
        const generic = getGenericStatement(item, entry.answer, bodyRegion, department);
        if (generic) {
          sectionLines.push(generic);
        } else {
          // Fallback
          if (entry.answer === "no") {
            sectionLines.push(`No ${question.toLowerCase()}`);
          } else {
            sectionLines.push(`${question} present`);
          }
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
  const department = caseData.department;
  const [answers, setAnswers] = useState(() => buildInitialAnswers(caseData.proforma_data, department));
  const [saving, setSaving] = useState(false);

  const bodyRegion = detectBodyRegion(
    `${caseData.presenting_complaint || ""} ${caseData.referral_summary || ""} ${caseData.mechanism_of_injury || ""}`
  );

  useEffect(() => {
    setAnswers(buildInitialAnswers(caseData.proforma_data, department));
  }, [caseData.proforma_data, department]);

  const sections = getSections(department);

  const handleAnswer = (key, answer) => {
    setAnswers(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        answer: prev[key]?.answer === answer ? null : answer,
        detail: answer === "no" ? "" : prev[key]?.detail || "",
      },
    }));
  };

  const handleDetail = (key, detail) => {
    setAnswers(prev => ({
      ...prev,
      [key]: { ...prev[key], detail },
    }));
  };

  const handleMeds = (key, meds) => {
    setAnswers(prev => ({
      ...prev,
      [key]: { ...prev[key], meds },
    }));
  };

  const handleTickAllNo = (section) => {
    setAnswers(prev => {
      const next = { ...prev };
      for (const item of section.items) {
        const key = `${section.title}::${item}`;
        if (next[key]) {
          next[key] = { ...next[key], answer: "no", detail: "" };
        }
      }
      return next;
    });
  };

  const handleTickAllYes = (section) => {
    setAnswers(prev => {
      const next = { ...prev };
      for (const item of section.items) {
        const key = `${section.title}::${item}`;
        if (next[key]) {
          next[key] = { ...next[key], answer: "yes" };
        }
      }
      return next;
    });
  };

  const isSectionAllNo = (section) => {
    return section.items.every(item => {
      const key = `${section.title}::${item}`;
      return answers[key]?.answer === "no";
    });
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

  const compiled = compileProformaLines(answers, caseData);
  const answeredCount = Object.values(answers).filter(a => a.answer !== null).length;
  const totalCount = Object.keys(answers).length;

  const hasNewComplaintOrQuery = caseData.presenting_complaint || caseData.referral_summary || caseData.status === "inews_consult";
  const isInpatient = hasNewComplaintOrQuery && (caseData.status === "inews_consult" || caseData.status === "admitted" || caseData.bed_number || caseData.admission_date);

  return (
    <div className="space-y-4">
      {/* Editable patient details — shown when there's a new complaint or query for an inpatient */}
      {isInpatient && (
        <div className="bg-card border-2 border-hive-gold/30 rounded-xl p-4">
          <h3 className="text-sm font-bold text-hive-gold uppercase tracking-wide mb-3">Inpatient Details</h3>
          <PatientInfoEditor caseData={caseData} onUpdate={onUpdate} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {isInpatient ? "Inpatient Proforma" : department === "general_surgery" ? "General Surgery Proforma" : "Orthopaedic Proforma"}
          </h3>
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

      {bodyRegion !== 'default' && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/10 text-accent text-[11px] font-medium">
          <Sparkles className="w-3 h-3" />
          Auto-tailoring to: {bodyRegion.replace('_', ' ')} injury
        </div>
      )}

      {/* Proforma sections */}
      {sections.map((section) => {
        const SectionIcon = section.icon;
        return (
          <div key={section.title} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                {SectionIcon ? <SectionIcon className="w-4 h-4 text-hive-gold" /> : null}
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{section.title}</h4>
              </div>
              <div className="flex items-center gap-1.5">
                {isSectionAllNo(section) && (
                  <span className="text-[10px] text-success font-medium">✓ All clear</span>
                )}
                <button
                  onClick={() => handleTickAllYes(section)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
                >
                  <CheckCheck className="w-3 h-3" /> All Yes
                </button>
                <button
                  onClick={() => handleTickAllNo(section)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors"
                >
                  <CheckCheck className="w-3 h-3" /> All No
                </button>
              </div>
            </div>
            <div className="space-y-2.5">
              {section.items.map((item) => {
                const key = `${section.title}::${item}`;
                const entry = answers[key] || { answer: null, detail: "" };
                const hasDetail = entry.detail?.trim();
                const generic = !hasDetail && entry.answer !== null
                  ? getGenericStatement(item, entry.answer, bodyRegion, department)
                  : null;

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

                    {/* Auto-generated generic statement preview */}
                    {generic && (
                      <div className="mt-1.5 flex items-start gap-1.5 px-3 py-1.5 bg-accent/5 rounded-md border border-accent/15">
                        <Sparkles className="w-3 h-3 text-accent mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-accent italic">{generic}</p>
                      </div>
                    )}

                    {/* Anticoagulant quick-tick selector */}
                    {entry.answer === "yes" && item === "On anticoagulants?" && (
                      <AnticoagulantSelector
                        selected={entry.meds || []}
                        onChange={(meds) => handleMeds(key, meds)}
                      />
                    )}

                    {/* Diabetic medication quick-tick selector */}
                    {entry.answer === "yes" && item === "Diabetic?" && (
                      <DiabeticMedSelector
                        selected={entry.meds || []}
                        onChange={(meds) => handleMeds(key, meds)}
                      />
                    )}

                    {/* Detail input for other "yes" answers */}
                    {entry.answer === "yes" && item !== "On anticoagulants?" && item !== "Diabetic?" && (
                      <input
                        type="text"
                        value={entry.detail}
                        onChange={(e) => handleDetail(key, e.target.value)}
                        placeholder="Add detail (optional — leave blank for auto-statement)..."
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

    </div>
  );
}