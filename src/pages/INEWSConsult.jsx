import React, { useState, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { processINEWSConsult, uploadFile } from "@/lib/hiveApi";
import HandwritingOCR from "@/components/HandwritingOCR";
import LabResultsCapture from "@/components/LabResultsCapture";
import KardexCapture from "@/components/KardexCapture";
import { recognizeVitals } from "@/lib/hiveApi";
import AIBadge from "@/components/AIBadge";
import { Camera, Loader2, AlertTriangle, Stethoscope, Activity, Send, Phone, FlaskConical, Pill, ClipboardList, ChevronDown, ChevronUp, Info } from "lucide-react";

const POST_OP_SYMPTOMS = [
  "Fever / pyrexia",
  "Tachycardia",
  "Hypotension",
  "Reduced urine output",
  "Abdominal pain / distension",
  "Wound concern (erythema, discharge, dehiscence)",
  "Shortness of breath",
  "Chest pain",
  "Unilateral leg swelling",
  "Confusion / delirium",
  "Nausea / vomiting",
  "Not passing flatus / stool",
  "Severe pain (out of proportion)",
  "Oozing from wound / drain",
  "Oliguria / dark urine",
];

export default function INEWSConsult() {
  const { user } = useAuth();
  const [step, setStep] = useState("input");
  const [patientPhoto, setPatientPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState({ name: "", mrn: "", dob: "", ward: "", procedure: "", pod: "" });
  const [nurseNarrative, setNurseNarrative] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [vitals, setVitals] = useState({ hr: "", bp_sys: "", bp_dia: "", rr: "", spO2: "", temp: "", avpu: "A" });
  const [labResults, setLabResults] = useState([]);
  const [kardexData, setKardexData] = useState(null);
  const [result, setResult] = useState(null);
  const [sections, setSections] = useState({ narrative: true, vitals: true, labs: false, kardex: false });
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

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms(prev => prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]);
  };

  const handleVitalsOCR = (result) => {
    if (result.vitals) {
      setVitals(prev => ({
        ...prev,
        hr: result.vitals.hr || prev.hr,
        bp_sys: result.vitals.bp_sys || prev.bp_sys,
        bp_dia: result.vitals.bp_dia || prev.bp_dia,
        rr: result.vitals.rr || prev.rr,
        spO2: result.vitals.spO2 || prev.spO2,
        temp: result.vitals.temp || prev.temp,
        avpu: result.vitals.avpu || prev.avpu,
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const inewsData = { ...vitals, calculated_score: calculateINEWS(vitals) };
      const info = `${patientInfo.name}, MRN: ${patientInfo.mrn}, DOB: ${patientInfo.dob}, Ward: ${patientInfo.ward}, Procedure: ${patientInfo.procedure || "N/A"}, POD: ${patientInfo.pod || "N/A"}`;
      const fullNarrative = [nurseNarrative.trim(), selectedSymptoms.length > 0 ? `Reported symptoms: ${selectedSymptoms.join(", ")}` : ""].filter(Boolean).join("\n");
      const result = await processINEWSConsult(inewsData, info, patientPhoto ? [patientPhoto] : [], labResults, kardexData, fullNarrative);
      setResult(result);

      const caseData = {
        patient_name: patientInfo.name || "Unknown",
        patient_mrn: patientInfo.mrn,
        patient_dob: patientInfo.dob,
        hospital: user?.hospital || "",
        department: user?.department || "general_surgery",
        status: "inews_consult",
        inews_score: inewsData.calculated_score,
        inews_data: inewsData,
        referral_summary: `Inpatient Consult — INEWS ${inewsData.calculated_score}. Nurse concern: ${fullNarrative || "See vitals"}`,
        presenting_complaint: `INEWS ${inewsData.calculated_score} — ${selectedSymptoms.join(", ") || "Inpatient consult"}`,
        kardex_data: kardexData,
      };
      const createdCase = await base44.entities.CaseFile.create(caseData);

      for (const lab of labResults) {
        await base44.entities.LabResult.create({
          ...lab,
          case_id: createdCase.id,
          patient_name: patientInfo.name,
          patient_mrn: patientInfo.mrn,
        });
      }

      setStep("result");
    } catch {
      alert("Failed to process consult.");
    } finally {
      setLoading(false);
    }
  };

  const inewsScore = calculateINEWS(vitals);
  const canSubmit = patientInfo.name && (nurseNarrative.trim() || selectedSymptoms.length > 0 || inewsScore > 0);

  const toggleSection = (key) => setSections(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Phone className="w-5 h-5 text-hive-gold" />
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Inpatient Consult</h1>
        </div>
        <p className="text-sm text-muted-foreground">Ward nurse referral for post-operative inpatient concerns — structured intake with vitals, labs & kardex</p>
      </div>

      {step === "input" && (
        <div className="space-y-4">
          {/* Patient Identity */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-hive-gold" /> Patient Identity
            </h3>
            <div className="flex items-start gap-4 flex-wrap">
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
              <button onClick={() => fileRef.current?.click()} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} Scan ID Band
              </button>
              {patientPhoto && <img src={patientPhoto} alt="patient ID" className="w-16 h-16 rounded-lg object-cover border border-border" />}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <Input label="Patient Name" value={patientInfo.name} onChange={v => setPatientInfo(p => ({ ...p, name: v }))} />
              <Input label="MRN" value={patientInfo.mrn} onChange={v => setPatientInfo(p => ({ ...p, mrn: v }))} />
              <Input label="DOB" type="date" value={patientInfo.dob} onChange={v => setPatientInfo(p => ({ ...p, dob: v }))} />
              <Input label="Ward" value={patientInfo.ward} onChange={v => setPatientInfo(p => ({ ...p, ward: v }))} />
              <Input label="Procedure (if post-op)" value={patientInfo.procedure} onChange={v => setPatientInfo(p => ({ ...p, procedure: v }))} />
              <Input label="Post-Op Day" value={patientInfo.pod} onChange={v => setPatientInfo(p => ({ ...p, pod: v }))} />
            </div>
          </div>

          {/* Nurse Referral Narrative */}
          <Section title="Nurse Referral — What's the concern?" icon={Phone} open={sections.narrative} onToggle={() => toggleSection("narrative")}>
            <p className="text-xs text-muted-foreground mb-3">Document what the nurse is reporting — common post-op complication symptoms and signs. Tap relevant symptoms or type the narrative.</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {POST_OP_SYMPTOMS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSymptom(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedSymptoms.includes(s)
                      ? "bg-hive-gold/15 text-hive-gold border border-hive-gold/30"
                      : "bg-secondary text-muted-foreground border border-border hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <textarea
              value={nurseNarrative}
              onChange={e => setNurseNarrative(e.target.value)}
              rows={4}
              placeholder="e.g. Nurse reports patient day 2 post-op, fever 38.5, HR 110, wound site red and tender. Patient also complaining of increased pain at surgical site..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50 resize-none"
            />
          </Section>

          {/* Vitals / INEWS */}
          <Section title="INEWS Vitals" icon={Activity} open={sections.vitals} onToggle={() => toggleSection("vitals")}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-muted-foreground">Calculated INEWS:</span>
              <span className={`px-2 py-0.5 rounded text-sm font-bold ${inewsScore >= 7 ? "bg-destructive/20 text-destructive" : inewsScore >= 5 ? "bg-warning/20 text-warning" : inewsScore >= 3 ? "bg-accent/20 text-accent" : "bg-success/20 text-success"}`}>
                {inewsScore}
              </span>
              {inewsScore === 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 ml-2">
                  <Info className="w-3 h-3" /> INEWS 0 — generic assessment will be generated
                </span>
              )}
            </div>
            <div className="mb-4">
              <HandwritingOCR
                ocrFunction={recognizeVitals}
                onResult={handleVitalsOCR}
                label="Scan Observation Chart"
                description="Photograph the handwritten obs chart — AI extracts vital signs automatically"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input label="HR (bpm)" value={vitals.hr} onChange={v => setVitals(p => ({ ...p, hr: v }))} />
              <Input label="BP Sys" value={vitals.bp_sys} onChange={v => setVitals(p => ({ ...p, bp_sys: v }))} />
              <Input label="BP Dia" value={vitals.bp_dia} onChange={v => setVitals(p => ({ ...p, bp_dia: v }))} />
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
          </Section>

          {/* Lab Results */}
          <Section title="Lab Results" icon={FlaskConical} open={sections.labs} onToggle={() => toggleSection("labs")}>
            <LabResultsCapture labResults={labResults} onChange={setLabResults} />
          </Section>

          {/* Kardex */}
          <Section title="Medical Kardex" icon={Pill} open={sections.kardex} onToggle={() => toggleSection("kardex")}>
            <KardexCapture kardexData={kardexData} onChange={setKardexData} />
          </Section>

          <button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            className="w-full px-4 py-3 rounded-lg bg-hive-gold text-hive-gold-foreground font-semibold text-sm hover:bg-hive-gold/90 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stethoscope className="w-4 h-4" />}
            Generate Assessment
          </button>
        </div>
      )}

      {step === "result" && result && (
        <div className="space-y-4">
          <div className="bg-card border-2 border-hive-gold/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground">{inewsScore === 0 ? "Generic Assessment" : "Escalation Assessment"}</h3>
              <AIBadge />
            </div>
            <div className="mb-3">
              <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${inewsScore >= 7 ? "bg-destructive/20 text-destructive" : inewsScore >= 5 ? "bg-warning/20 text-warning" : inewsScore >= 3 ? "bg-accent/20 text-accent" : "bg-success/20 text-success"}`}>
                INEWS Score: {inewsScore}
              </span>
              {inewsScore === 0 && (
                <span className="ml-2 text-xs text-muted-foreground">INEWS not elevated — generic assessment generated based on clinical concern</span>
              )}
            </div>
          </div>

          {result.sbar_summary && <ResultSection title={inewsScore === 0 ? "Summary" : "SBAR Summary"} icon={Send} content={result.sbar_summary} />}
          {result.differentials && <ResultSection title="Differential Diagnoses" icon={Stethoscope} content={result.differentials} />}
          {result.immediate_management && <ResultSection title="Immediate Management" icon={Activity} content={result.immediate_management} />}
          {result.investigation_recommendations && <ResultSection title="Investigations" icon={Activity} content={result.investigation_recommendations} />}
          {result.escalation_recommendation && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <h4 className="font-semibold text-destructive text-sm">Recommendation</h4>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{result.escalation_recommendation}</p>
            </div>
          )}

          <button onClick={() => { setStep("input"); setResult(null); setVitals({ hr: "", bp_sys: "", bp_dia: "", rr: "", spO2: "", temp: "", avpu: "A" }); setLabResults([]); setKardexData(null); setNurseNarrative(""); setSelectedSymptoms([]); }} className="w-full px-4 py-2.5 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80">
            New Inpatient Consult
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, open, onToggle, children }) {
  return (
    <div className="bg-card border border-border rounded-xl">
      <button onClick={onToggle} className="flex items-center gap-2 w-full px-4 py-3">
        <Icon className="w-4 h-4 text-hive-gold" />
        <h3 className="font-semibold text-foreground text-sm flex-1 text-left">{title}</h3>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
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