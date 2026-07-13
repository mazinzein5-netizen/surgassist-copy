import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, AlertTriangle, Activity, Syringe, Pill, Loader2, Save, Droplets, Heart } from "lucide-react";

/**
 * VTE Prophylaxis & Bridging Calculator
 * Auto-assesses VTE risk, bleeding risk, and anticoagulant bridging requirements
 * based on medications in the kardex and proforma comorbidity data.
 */

// Anticoagulant classification for bridging
const ANTICOAGULANTS = {
  warfarin: { name: "Warfarin", bridge: true, stop_days: 5, restart: "evening of surgery / POD 0", note: "Bridge with LMWH. Check INR day before surgery." },
  apixaban: { name: "Apixaban (DOAC)", bridge: false, stop_days: 2, restart: "POD 1 (12-24h post-op)", note: "No bridging usually required. Stop 48h pre-op." },
  rivaroxaban: { name: "Rivaroxaban (DOAC)", bridge: false, stop_days: 2, restart: "POD 1 (12-24h post-op)", note: "No bridging usually required. Stop 48h pre-op." },
  dabigatran: { name: "Dabigatran (DOAC)", bridge: false, stop_days: 2, restart: "POD 1 (12-24h post-op)", note: "No bridging usually required. Check renal function." },
  edoxaban: { name: "Edoxaban (DOAC)", bridge: false, stop_days: 2, restart: "POD 1 (12-24h post-op)", note: "No bridging usually required." },
  clopidogrel: { name: "Clopidogrel", bridge: false, stop_days: 5, restart: "POD 1", note: "Stop 5-7 days pre-op unless recent stent (<12mo)." },
  aspirin: { name: "Aspirin", bridge: false, stop_days: 0, restart: "Continue", note: "Usually continue unless high bleeding risk." },
  enoxaparin: { name: "Enoxaparin (LMWH)", bridge: false, stop_days: 1, restart: "POD 1", note: "Therapeutic dose bridging if transitioning from warfarin." },
};

function classifyAnticoagulant(drugName) {
  const lower = (drugName || "").toLowerCase();
  for (const [key, info] of Object.entries(ANTICOAGULANTS)) {
    if (lower.includes(key) || lower.includes(info.name.toLowerCase().split(" ")[0])) return { key, ...info };
  }
  return null;
}

// VTE risk factor scoring
function assessVTERisk(caseData, kardex) {
  const factors = [];
  let score = 0;

  // Surgical risk
  const isOrtho = caseData.department === "orthopaedics";
  if (isOrtho) { factors.push("Orthopaedic surgery (high VTE risk)"); score += 3; }
  else { factors.push("General surgery (moderate VTE risk)"); score += 2; }

  // Age
  if (caseData.patient_dob) {
    const age = Math.floor((Date.now() - new Date(caseData.patient_dob).getTime()) / 31536000000);
    if (age >= 60) { factors.push(`Age ${age} (>60)`);
      score += 2; }
    else if (age >= 40) { factors.push(`Age ${age} (40-59)`); score += 1; }
  }

  // Comorbidities from proforma
  const proforma = caseData.proforma_data || {};
  for (const [key, entry] of Object.entries(proforma)) {
    if (entry.answer !== "yes") continue;
    const lower = key.toLowerCase();
    if (lower.includes("cancer") || lower.includes("malign")) { factors.push("Active malignancy"); score += 3; }
    if (lower.includes("diabet")) { factors.push("Diabetes"); score += 1; }
    if (lower.includes("obes") || lower.includes("bmi")) { factors.push("Obesity (BMI>30)"); score += 1; }
    if (lower.includes("smoker")) { factors.push("Active smoker"); score += 1; }
    if (lower.includes("cardiac") || lower.includes("heart") || lower.includes("failure")) { factors.push("Cardiac disease"); score += 1; }
    if (lower.includes("resp") || lower.includes("copd")) { factors.push("Respiratory disease"); score += 1; }
    if (lower.includes("anticoagul") || lower.includes("warfarin") || lower.includes("doac")) { factors.push("On anticoagulants"); score += 1; }
  }

  // Comorbidities text
  const comorbidities = (caseData.kardex_data?.comorbidities || caseData.admission_note || "").toLowerCase();
  if (comorbidities.includes("cancer") || comorbidities.includes("malign")) { factors.push("Active malignancy (from note)"); score += 3; }
  if (comorbidities.includes("pregnan")) { factors.push("Pregnancy"); score += 1; }

  // Immobility
  if (caseData.proforma_data) {
    for (const [key, entry] of Object.entries(caseData.proforma_data)) {
      if (entry.answer === "yes" && key.toLowerCase().includes("immobil")) { factors.push("Reduced mobility"); score += 2; }
    }
  }

  // Recent surgery / fracture
  if (isOrtho && (caseData.diagnosis || "").toLowerCase().includes("fracture")) {
    factors.push("Acute fracture (orthopaedic)"); score += 2;
  }

  // Acute infection
  if (comorbidities.includes("infection") || comorbidities.includes("sepsis")) { factors.push("Acute infection/sepsis"); score += 1; }

  return { factors, score };
}

function assessBleedingRisk(caseData) {
  const risks = [];
  const text = `${caseData.referral_summary || ""} ${caseData.admission_note || ""} ${caseData.diagnosis || ""}`.toLowerCase();

  if (text.includes("renal") || text.includes("ckd") || text.includes("kidney")) risks.push("Renal impairment");
  if (text.includes("liver") || text.includes("hepatic")) risks.push("Liver disease");
  if (text.includes("platelet") || text.includes("thrombocytopen")) risks.push("Thrombocytopenia");
  if (text.includes("bleed") || text.includes("haemorrhag")) risks.push("Active bleeding");
  if (text.includes("inr") || text.includes("coagulopat")) risks.push("Coagulopathy");
  if (text.includes("ibuprofen") || text.includes("nsaid")) risks.push("Concurrent NSAID use");

  return risks;
}

function recommendProphylaxis(vteScore, bleedingRisks, isOrtho) {
  const highBleed = bleedingRisks.length >= 2;

  if (vteScore >= 5 && !highBleed) {
    return {
      level: "high",
      color: "red",
      protocol: isOrtho
        ? "Enoxaparin 40mg SC OD (start 6-12h post-op, continue for 28-35 days post-hip, 10-14 days post-knee)"
        : "Enoxaparin 40mg SC OD (start 6-12h post-op, continue 5-7 days or until mobile)",
      mechanical: "TED stockings + IPC intraoperatively and postoperatively",
      duration: isOrtho ? "28-35 days (hip) / 10-14 days (knee)" : "5-7 days or until fully mobile",
    };
  }
  if (vteScore >= 2 && !highBleed) {
    return {
      level: "moderate",
      color: "amber",
      protocol: "Enoxaparin 40mg SC OD (start 12h post-op, continue 5-7 days or until mobile)",
      mechanical: "TED stockings + IPC",
      duration: "5-7 days or until mobile",
    };
  }
  if (highBleed) {
    return {
      level: "caution",
      color: "red",
      protocol: "Mechanical prophylaxis only until bleeding risk resolves, then reassess for LMWH",
      mechanical: "TED stockings + IPC (mandatory)",
      duration: "Reassess in 48h",
    };
  }
  return {
    level: "low",
    color: "green",
    protocol: "Early mobilisation + adequate hydration. Mechanical prophylaxis if immobile.",
    mechanical: "TED stockings if immobile >24h",
    duration: "Until discharge",
  };
}

const COLOR_MAP = {
  red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "text-red-600", label: "HIGH RISK" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "text-amber-600", label: "MODERATE RISK" },
  green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: "text-green-600", label: "LOW RISK" },
};

export default function VTEProphylaxisPanel({ caseData, kardex, user, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(caseData?.vte_assessment || null);

  const assessment = useMemo(() => {
    const vte = assessVTERisk(caseData, kardex);
    const bleeding = assessBleedingRisk(caseData);
    const recommendation = recommendProphylaxis(vte.score, bleeding, caseData.department === "orthopaedics");

    // Detect anticoagulants in kardex medications
    const anticoagulants = [];
    (kardex?.medications || []).forEach(med => {
      const ac = classifyAnticoagulant(med.drug);
      if (ac) anticoagulants.push({ ...ac, medication: med.drug, dose: med.dose, frequency: med.frequency });
    });

    // Check proforma for anticoagulants
    if (caseData.proforma_data) {
      for (const [key, entry] of Object.entries(caseData.proforma_data)) {
        if (entry.answer === "yes" && key.toLowerCase().includes("anticoagul")) {
          // Try to find which one from the text
          const note = entry.note || entry.text || "";
          if (note && !anticoagulants.some(a => a.key === "warfarin") && note.toLowerCase().includes("warfarin")) {
            anticoagulants.push({ key: "warfarin", ...ANTICOAGULANTS.warfarin, medication: "Warfarin (from proforma)", dose: "—", frequency: "—" });
          }
        }
      }
    }

    const bridgingRequired = anticoagulants.some(a => a.bridge);

    return { vte, bleeding, recommendation, anticoagulants, bridgingRequired };
  }, [caseData, kardex]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        vte_score: assessment.vte.score,
        vte_risk_factors: assessment.vte.factors,
        bleeding_risks: assessment.bleeding,
        recommendation: assessment.recommendation,
        anticoagulants: assessment.anticoagulants,
        bridging_required: assessment.bridgingRequired,
        assessed_at: new Date().toISOString(),
        assessed_by: user?.full_name || "Unknown",
      };
      await base44.entities.CaseFile.update(caseData.id, { vte_assessment: data });
      setSavedAssessment(data);
      onUpdate?.();
    } catch {
      alert("Failed to save VTE assessment.");
    } finally {
      setSaving(false);
    }
  };

  const colors = COLOR_MAP[assessment.recommendation.color];

  return (
    <div className="space-y-3">
      {/* Risk summary banner */}
      <div className={`rounded-xl p-4 border ${colors.bg} ${colors.border} flex items-center gap-3`}>
        <Activity className={`w-5 h-5 ${colors.icon} flex-shrink-0`} />
        <div className="flex-1">
          <p className={`text-sm font-bold ${colors.text}`}>{colors.label} — VTE Score: {assessment.vte.score}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {assessment.vte.factors.length} risk factor{assessment.vte.factors.length !== 1 ? "s" : ""} identified
            {assessment.bleeding.length > 0 && ` · ${assessment.bleeding.length} bleeding risk${assessment.bleeding.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Bridging alert */}
      {assessment.bridgingRequired && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Syringe className="w-4 h-4 text-orange-600" />
            <span className="font-bold text-orange-700 text-sm">⚠ Anticoagulant Bridging Required</span>
          </div>
          <div className="space-y-2">
            {assessment.anticoagulants.filter(a => a.bridge).map((ac, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-orange-200">
                <p className="text-sm font-semibold text-gray-900">{ac.name} — {ac.medication} {ac.dose} {ac.frequency}</p>
                <div className="mt-1.5 space-y-0.5 text-xs text-gray-600">
                  <p>⏱ Stop <strong>{ac.stop_days} days</strong> pre-operatively</p>
                  <p>💊 Bridge with therapeutic LMWH (Enoxaparin 1mg/kg SC BD or 1.5mg/kg OD)</p>
                  <p>🔄 Restart warfarin evening of surgery / POD 0; continue LMWH until INR ≥ 2.0 for 2 consecutive days</p>
                  <p>📋 {ac.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DOACs detected (no bridging) */}
      {assessment.anticoagulants.filter(a => !a.bridge).length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Pill className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-blue-700 text-sm">Anticoagulants — No Bridging Required</span>
          </div>
          <div className="space-y-1.5">
            {assessment.anticoagulants.filter(a => !a.bridge).map((ac, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                <span className="font-semibold text-blue-600 flex-shrink-0">{ac.name}:</span>
                <span>Stop {ac.stop_days > 0 ? `${ac.stop_days} days` : "—"} pre-op · Restart: {ac.restart} · {ac.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VTE risk factors */}
      {assessment.vte.factors.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">VTE Risk Factors</h4>
          <div className="flex flex-wrap gap-1.5">
            {assessment.vte.factors.map((f, i) => (
              <span key={i} className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* Bleeding risks */}
      {assessment.bleeding.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Bleeding Risk Factors</h4>
          <div className="flex flex-wrap gap-1.5">
            {assessment.bleeding.map((r, i) => (
              <span key={i} className="px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">{r}</span>
            ))}
          </div>
        </div>
      )}

      {/* Recommended prophylaxis protocol */}
      <div className={`rounded-xl border p-4 ${colors.bg} ${colors.border}`}>
        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> Recommended Prophylaxis
        </h4>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Droplets className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-gray-600">Pharmacological</p>
              <p className="text-sm text-gray-900">{assessment.recommendation.protocol}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Heart className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-gray-600">Mechanical</p>
              <p className="text-sm text-gray-900">{assessment.recommendation.mechanical}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Activity className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-gray-600">Duration</p>
              <p className="text-sm text-gray-900">{assessment.recommendation.duration}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-4 py-2.5 rounded-lg bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save VTE Assessment
      </button>

      {savedAssessment && (
        <p className="text-xs text-gray-400 text-center">
          Last assessed: {new Date(savedAssessment.assessed_at).toLocaleString("en-GB")} by {savedAssessment.assessed_by}
        </p>
      )}
    </div>
  );
}