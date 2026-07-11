import React, { useState, useEffect } from "react";
import { calculateDrugDose, generateGuidelineDrugProtocol } from "@/lib/hiveApi";
import AIBadge from "@/components/AIBadge";
import { Calculator, Loader2, AlertTriangle, Pill, Info, Ban, Activity, Stethoscope, HeartPulse, ClipboardList, BookOpen, Search, Clock, ArrowRight, CheckCircle2, X } from "lucide-react";

const DRUG_CATEGORIES = {
  antibiotics: ["Co-amoxiclav", "Ceftriaxone", "Metronidazole", "Gentamicin", "Vancomycin", "Piperacillin-tazobactam", "Cefuroxime", "Clarithromycin"],
  anticoagulants: ["Enoxaparin (LMWH)", "Heparin", "Apixaban", "Rivaroxaban", "Warfarin", "Dalteparin"],
  analgesia: ["Paracetamol", "Ibuprofen", "Diclofenac", "Tramadol", "Morphine", "Oxycodone", "Fentanyl", "Codeine"],
  antiemetics: ["Ondansetron", "Cyclizine", "Metoclopramide", "Prochlorperazine", "Dexamethasone"],
  other: ["Omeprazole", "Pantoprazole", "Insulin (sliding scale)", "Salbutamol", "Hydrocortisone", "Dexamethasone"],
};

export default function DrugCalculatorPanel({ caseData, onClose }) {
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [eGFR, setEGFR] = useState("");
  const [allergies, setAllergies] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [category, setCategory] = useState("antibiotics");
  const [drug, setDrug] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [protocol, setProtocol] = useState(null);
  const [protocolLoading, setProtocolLoading] = useState(false);

  // Pre-fill patient parameters from case data
  useEffect(() => {
    if (caseData) {
      setAllergies(caseData.kardex_data?.allergies || "");
      setDiagnosis(caseData.presenting_complaint || caseData.referral_summary?.slice(0, 120) || "");
      // Try to derive age from DOB
      if (caseData.patient_dob) {
        const dob = new Date(caseData.patient_dob);
        const ageYears = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000));
        if (ageYears > 0 && ageYears < 130) setAge(String(ageYears));
      }
    }
  }, [caseData]);

  const handleCalculate = async () => {
    if (!drug) return;
    setLoading(true);
    try {
      const res = await calculateDrugDose(drug, weight, age, eGFR, allergies, diagnosis);
      setResult(res);
    } catch {
      alert("Failed to calculate dose.");
    } finally {
      setLoading(false);
    }
  };

  const handleFindProtocol = async () => {
    if (!diagnosis) return;
    setProtocolLoading(true);
    try {
      const res = await generateGuidelineDrugProtocol(diagnosis, weight, age, eGFR, allergies);
      setProtocol(res);
    } catch {
      alert("Failed to fetch guideline protocol.");
    } finally {
      setProtocolLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
      <div className="w-full max-w-3xl bg-card border border-border rounded-xl shadow-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-hive-gold" />
            <div>
              <h2 className="text-base font-bold text-foreground">Drug Dose Calculator</h2>
              <p className="text-xs text-muted-foreground">{caseData?.patient_name} · MRN: {caseData?.patient_mrn || "N/A"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Patient Parameters */}
          <div className="bg-background border border-border rounded-xl p-4">
            <h3 className="font-semibold text-foreground text-sm mb-3">Patient Parameters</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Weight (kg)" value={weight} onChange={setWeight} />
              <Field label="Age" value={age} onChange={setAge} />
              <Field label="eGFR (mL/min)" value={eGFR} onChange={setEGFR} />
              <Field label="Allergies" value={allergies} onChange={setAllergies} placeholder="e.g. Penicillin" />
            </div>
            <div className="mt-3">
              <Field label="Diagnosis / Indication" value={diagnosis} onChange={setDiagnosis} placeholder="e.g. Cellulitis, NOF fracture" />
            </div>
          </div>

          {/* Drug Selection */}
          <div className="bg-background border border-border rounded-xl p-4">
            <h3 className="font-semibold text-foreground text-sm mb-3">Drug Selection</h3>
            <div className="mb-3">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
              <div className="flex gap-1 flex-wrap">
                {Object.keys(DRUG_CATEGORIES).map(cat => (
                  <button key={cat} onClick={() => { setCategory(cat); setDrug(""); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${category === cat ? "bg-hive-gold/15 text-hive-gold border border-hive-gold/30" : "bg-secondary text-muted-foreground border border-border"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Drug</label>
              <select value={drug} onChange={e => setDrug(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50">
                <option value="">Select a drug...</option>
                {DRUG_CATEGORIES[category].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Guideline Protocol Lookup */}
          {diagnosis && (
            <div>
              <button
                onClick={handleFindProtocol}
                disabled={protocolLoading}
                className="w-full px-4 py-3 rounded-lg bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 flex items-center justify-center gap-2"
              >
                {protocolLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Find Updated Guideline Algorithm for "{diagnosis}"
              </button>
              <p className="text-[10px] text-muted-foreground text-center mt-1">Searches current NICE / HSE / SIGN / BOA guidelines online</p>
            </div>
          )}

          <button onClick={handleCalculate} disabled={loading || !drug} className="w-full px-4 py-3 rounded-lg bg-hive-gold text-hive-gold-foreground font-semibold text-sm hover:bg-hive-gold/90 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
            Calculate Dose & Protocol
          </button>

          {/* Result */}
          {result && (
            <div className="bg-background border-2 border-hive-gold/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground">Dose Recommendation</h3>
                <AIBadge />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-hive-gold/10 border border-hive-gold/20">
                  <Pill className="w-5 h-5 text-hive-gold" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{drug}</p>
                    <p className="text-lg font-bold text-hive-gold">{result.dose}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-xs text-muted-foreground">Route</p>
                    <p className="text-sm font-medium text-foreground">{result.route}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-xs text-muted-foreground">Frequency</p>
                    <p className="text-sm font-medium text-foreground">{result.frequency}</p>
                  </div>
                </div>
                {result.drug_info && <ResultCard title="Drug Information" icon={Info} content={result.drug_info} />}
                {result.indications && <ResultCard title="Indications" icon={Stethoscope} content={result.indications} />}
                {result.contraindications && <ResultCard title="Contraindications" icon={Ban} content={result.contraindications} tone="warning" />}
                {result.warnings && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-destructive uppercase">Warnings & Interactions</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{result.warnings}</p>
                    </div>
                  </div>
                )}
                {result.monitoring && <ResultCard title="Monitoring" icon={Activity} content={result.monitoring} />}
                {result.guideline_protocol && (
                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                    <div className="flex items-center gap-2 mb-1">
                      <ClipboardList className="w-4 h-4 text-accent" />
                      <p className="text-xs font-semibold text-accent uppercase">Guideline Prescription Protocol</p>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{result.guideline_protocol}</p>
                  </div>
                )}
                {result.supportive_care && (
                  <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                    <div className="flex items-center gap-2 mb-1">
                      <HeartPulse className="w-4 h-4 text-success" />
                      <p className="text-xs font-semibold text-success uppercase">Supportive Care</p>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{result.supportive_care}</p>
                  </div>
                )}
                {result.reference && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <BookOpen className="w-3 h-3 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground italic">Reference: {result.reference}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Guideline Protocol Results */}
          {protocol && (
            <div className="bg-background border-2 border-accent/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground">Guideline Algorithm — {diagnosis}</h3>
                <AIBadge />
              </div>
              <div className="space-y-3">
                {protocol.first_line_drugs?.length > 0 && (
                  <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <p className="text-xs font-semibold text-success uppercase">First-Line Prescribing</p>
                    </div>
                    <div className="space-y-2">
                      {protocol.first_line_drugs.map((d, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded bg-background/50">
                          <ArrowRight className="w-3 h-3 text-success flex-shrink-0 mt-1" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{d.drug} — {d.dose}</p>
                            <p className="text-xs text-muted-foreground">{d.route} · {d.frequency}</p>
                            {d.rationale && <p className="text-xs text-muted-foreground mt-0.5">{d.rationale}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {protocol.alternative_drugs?.length > 0 && (
                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Pill className="w-4 h-4 text-accent" />
                      <p className="text-xs font-semibold text-accent uppercase">Alternative Options</p>
                    </div>
                    <div className="space-y-2">
                      {protocol.alternative_drugs.map((d, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded bg-background/50">
                          <ArrowRight className="w-3 h-3 text-accent flex-shrink-0 mt-1" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{d.drug} — {d.dose}</p>
                            <p className="text-xs text-muted-foreground">{d.route} · {d.frequency}</p>
                            {d.rationale && <p className="text-xs text-muted-foreground mt-0.5">{d.rationale}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {protocol.guideline_algorithm && (
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <ClipboardList className="w-4 h-4 text-hive-gold" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Treatment Algorithm</p>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{protocol.guideline_algorithm}</p>
                  </div>
                )}
                {protocol.duration && (
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border flex items-center gap-2">
                    <Clock className="w-4 h-4 text-hive-gold flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Treatment Duration</p>
                      <p className="text-sm text-foreground">{protocol.duration}</p>
                    </div>
                  </div>
                )}
                {protocol.supportive_care && (
                  <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                    <div className="flex items-center gap-2 mb-1">
                      <HeartPulse className="w-4 h-4 text-success" />
                      <p className="text-xs font-semibold text-success uppercase">Supportive Care</p>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{protocol.supportive_care}</p>
                  </div>
                )}
                {protocol.red_flags && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-destructive uppercase">Red Flags — Escalate / Change Therapy</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{protocol.red_flags}</p>
                    </div>
                  </div>
                )}
                {protocol.guideline_source && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <BookOpen className="w-3 h-3 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground italic">Source: {protocol.guideline_source}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultCard({ title, icon: Icon, content, tone = "default" }) {
  const tones = {
    default: "bg-secondary/30 border-border",
    warning: "bg-warning/10 border-warning/30",
  };
  const iconColors = {
    default: "text-hive-gold",
    warning: "text-warning",
  };
  return (
    <div className={`p-3 rounded-lg border ${tones[tone]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${iconColors[tone]}`} />
        <p className={`text-xs font-semibold uppercase ${tone === "warning" ? "text-warning" : "text-muted-foreground"}`}>{title}</p>
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap">{content}</p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50" />
    </div>
  );
}