import React, { useState } from "react";
import { calculateDrugDose } from "@/lib/hiveApi";
import AIBadge from "@/components/AIBadge";
import { Calculator, Loader2, AlertTriangle, Pill } from "lucide-react";

const DRUG_CATEGORIES = {
  antibiotics: ["Co-amoxiclav", "Ceftriaxone", "Metronidazole", "Gentamicin", "Vancomycin", "Piperacillin-tazobactam", "Cefuroxime", "Clarithromycin"],
  anticoagulants: ["Enoxaparin (LMWH)", "Heparin", "Apixaban", "Rivaroxaban", "Warfarin", "Dalteparin"],
  analgesia: ["Paracetamol", "Ibuprofen", "Diclofenac", "Tramadol", "Morphine", "Oxycodone", "Fentanyl", "Codeine"],
  antiemetics: ["Ondansetron", "Cyclizine", "Metoclopramide", "Prochlorperazine", "Dexamethasone"],
  other: ["Omeprazole", "Pantoprazole", "Insulin (sliding scale)", "Salbutamol", "Hydrocortisone", "Dexamethasone"],
};

export default function DrugCalculator() {
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [eGFR, setEGFR] = useState("");
  const [allergies, setAllergies] = useState("");
  const [category, setCategory] = useState("antibiotics");
  const [drug, setDrug] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    if (!drug) return;
    setLoading(true);
    try {
      const res = await calculateDrugDose(drug, weight, age, eGFR, allergies);
      setResult(res);
    } catch {
      alert("Failed to calculate dose.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="w-5 h-5 text-hive-gold" />
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Drug Dose Calculator</h1>
        </div>
        <p className="text-sm text-muted-foreground">Weight & renal-adjusted dosing with allergy cross-check</p>
      </div>

      {/* Patient Parameters */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <h3 className="font-semibold text-foreground text-sm mb-3">Patient Parameters</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Weight (kg)" value={weight} onChange={setWeight} />
          <Field label="Age" value={age} onChange={setAge} />
          <Field label="eGFR (mL/min)" value={eGFR} onChange={setEGFR} />
          <Field label="Allergies" value={allergies} onChange={setAllergies} placeholder="e.g. Penicillin" />
        </div>
      </div>

      {/* Drug Selection */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
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

      <button onClick={handleCalculate} disabled={loading || !drug} className="w-full px-4 py-3 rounded-lg bg-hive-gold text-hive-gold-foreground font-semibold text-sm hover:bg-hive-gold/90 flex items-center justify-center gap-2 mb-4">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
        Calculate Dose
      </button>

      {/* Result */}
      {result && (
        <div className="bg-card border-2 border-hive-gold/30 rounded-xl p-5">
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
            {result.warnings && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-destructive uppercase">Warnings</p>
                  <p className="text-sm text-foreground">{result.warnings}</p>
                </div>
              </div>
            )}
            {result.reference && <p className="text-[10px] text-muted-foreground italic">Reference: {result.reference}</p>}
          </div>
        </div>
      )}
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