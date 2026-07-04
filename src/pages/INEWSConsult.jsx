import React, { useState, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { processINEWSConsult, uploadFile } from "@/lib/hiveApi";
import AIBadge from "@/components/AIBadge";
import { Camera, Loader2, AlertTriangle, Stethoscope, Activity, Send } from "lucide-react";

export default function INEWSConsult() {
  const { user } = useAuth();
  const [step, setStep] = useState("input"); // input, form, result
  const [patientPhoto, setPatientPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState({ name: "", mrn: "", dob: "", ward: "" });
  const [vitals, setVitals] = useState({ hr: "", bp_sys: "", bp_dia: "", rr: "", spO2: "", temp: "", avpu: "A" });
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const uploadResult = await uploadFile(file);
      setPatientPhoto(uploadResult.file_url);
    } catch {
      alert("Failed to upload photo.");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const inewsData = { ...vitals, calculated_score: calculateINEWS(vitals) };
      const info = `${patientInfo.name}, MRN: ${patientInfo.mrn}, DOB: ${patientInfo.dob}, Ward: ${patientInfo.ward}`;
      const result = await processINEWSConsult(inewsData, info, patientPhoto ? [patientPhoto] : []);
      setResult(result);

      // Create a case file for this consult
      await base44.entities.CaseFile.create({
        patient_name: patientInfo.name || "Unknown",
        patient_mrn: patientInfo.mrn,
        patient_dob: patientInfo.dob,
        hospital: user?.hospital || "",
        department: user?.department || "general_surgery",
        status: "inews_consult",
        inews_score: inewsData.calculated_score,
        inews_data: inewsData,
        referral_summary: `INEWS Consult — Score ${inewsData.calculated_score}. ${result.sbar_summary || ""}`,
        presenting_complaint: `INEWS ${inewsData.calculated_score} — Inpatient consult`,
      });
      setStep("result");
    } catch {
      alert("Failed to process consult.");
    } finally {
      setLoading(false);
    }
  };

  const inewsScore = calculateINEWS(vitals);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <h1 className="text-xl md:text-2xl font-bold text-foreground">INEWS Consult</h1>
        </div>
        <p className="text-sm text-muted-foreground">Rapid inpatient consult for patients with INEWS ≥ 2</p>
      </div>

      {step === "input" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-3">Step 1: Capture Patient ID</h3>
            <p className="text-sm text-muted-foreground mb-4">Photograph the patient's ID band or bedside chart for automatic data extraction.</p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
            <button onClick={() => fileRef.current?.click()} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} Capture Patient ID
            </button>
            {patientPhoto && (
              <div className="mt-3">
                <img src={patientPhoto} alt="patient ID" className="w-32 h-32 rounded-lg object-cover border border-border" />
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-3">Step 2: Enter / Confirm Patient Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Patient Name" value={patientInfo.name} onChange={v => setPatientInfo(p => ({ ...p, name: v }))} />
              <Input label="MRN" value={patientInfo.mrn} onChange={v => setPatientInfo(p => ({ ...p, mrn: v }))} />
              <Input label="DOB" type="date" value={patientInfo.dob} onChange={v => setPatientInfo(p => ({ ...p, dob: v }))} />
              <Input label="Ward" value={patientInfo.ward} onChange={v => setPatientInfo(p => ({ ...p, ward: v }))} />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-1">Step 3: INEWS Parameters</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-muted-foreground">Calculated INEWS:</span>
              <span className={`px-2 py-0.5 rounded text-sm font-bold ${inewsScore >= 7 ? "bg-destructive/20 text-destructive" : inewsScore >= 5 ? "bg-warning/20 text-warning" : inewsScore >= 3 ? "bg-accent/20 text-accent" : "bg-success/20 text-success"}`}>
                {inewsScore}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input label="HR (bpm)" value={vitals.hr} onChange={v => setVitals(p => ({ ...p, hr: v }))} />
              <Input label="BP Sys" value={vitals.bp_sys} onChange={v => setVitals(p => ({ ...p, bp_sys: v }))} />
              <Input label="RR (/min)" value={vitals.rr} onChange={v => setVitals(p => ({ ...p, rr: v }))} />
              <Input label="SpO₂ (%)" value={vitals.spO2} onChange={v => setVitals(p => ({ ...p, spO2: v }))} />
              <Input label="Temp (°C)" value={vitals.temp} onChange={v => setVitals(p => ({ ...p, temp: v }))} />
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">AVPU</label>
                <select value={vitals.avpu} onChange={e => setVitals(p => ({ ...p, avpu: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50">
                  <option value="A">Alert</option>
                  <option value="V">Voice</option>
                  <option value="P">Pain</option>
                  <option value="U">Unresponsive</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !patientInfo.name}
            className="w-full px-4 py-3 rounded-lg bg-hive-gold text-hive-gold-foreground font-semibold text-sm hover:bg-hive-gold/90 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stethoscope className="w-4 h-4" />}
            Generate Escalation Assessment
          </button>
        </div>
      )}

      {step === "result" && result && (
        <div className="space-y-4">
          <div className="bg-card border-2 border-hive-gold/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground">Escalation Assessment</h3>
              <AIBadge />
            </div>
            <div className="mb-3">
              <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${inewsScore >= 7 ? "bg-destructive/20 text-destructive" : inewsScore >= 5 ? "bg-warning/20 text-warning" : inewsScore >= 3 ? "bg-accent/20 text-accent" : "bg-success/20 text-success"}`}>
                INEWS Score: {inewsScore}
              </span>
            </div>
          </div>

          {result.sbar_summary && <ResultSection title="SBAR Summary" icon={Send} content={result.sbar_summary} />}
          {result.differentials && <ResultSection title="Differential Diagnoses" icon={Stethoscope} content={result.differentials} />}
          {result.immediate_management && <ResultSection title="Immediate Management" icon={Activity} content={result.immediate_management} />}
          {result.investigation_recommendations && <ResultSection title="Investigations" icon={Activity} content={result.investigation_recommendations} />}
          {result.escalation_recommendation && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <h4 className="font-semibold text-destructive text-sm">Escalation Recommendation</h4>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{result.escalation_recommendation}</p>
            </div>
          )}

          <button onClick={() => { setStep("input"); setResult(null); setVitals({ hr: "", bp_sys: "", bp_dia: "", rr: "", spO2: "", temp: "", avpu: "A" }); }} className="w-full px-4 py-2.5 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80">
            New INEWS Consult
          </button>
        </div>
      )}
    </div>
  );
}

function ResultSection({ title, icon: Icon, content }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-hive-gold" />
        <h4 className="font-semibold text-foreground text-sm">{title}</h4>
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap">{content}</p>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
      />
    </div>
  );
}

function calculateINEWS(v) {
  let score = 0;
  const hr = parseInt(v.hr);
  if (hr) { if (hr <= 40 || hr >= 131) score += 3; else if (hr <= 50 || hr >= 111) score += 2; else if (hr >= 91) score += 1; }
  const sys = parseInt(v.bp_sys);
  if (sys) { if (sys <= 90 || sys >= 220) score += 3; else if (sys <= 100) score += 2; else if (sys >= 181) score += 1; }
  const rr = parseInt(v.rr);
  if (rr) { if (rr <= 8 || rr >= 25) score += 3; else if (rr <= 11 || rr >= 21) score += 2; }
  const spO2 = parseInt(v.spO2);
  if (spO2) { if (spO2 <= 91) score += 3; else if (spO2 <= 93) score += 2; else if (spO2 <= 95) score += 1; }
  const temp = parseFloat(v.temp);
  if (temp) { if (temp < 35 || temp >= 39.1) score += 2; else if (temp >= 38.1) score += 1; }
  if (v.avpu === "V") score += 1;
  else if (v.avpu === "P") score += 2;
  else if (v.avpu === "U") score += 3;
  return score;
}