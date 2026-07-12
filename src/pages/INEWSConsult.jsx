import React, { useState, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { processINEWSConsult, uploadFile } from "@/lib/hiveApi";
import HandwritingOCR from "@/components/HandwritingOCR";
import LabResultsCapture from "@/components/LabResultsCapture";
import KardexCapture from "@/components/KardexCapture";
import OnCallTeamBar from "@/components/OnCallTeamBar";
import ReferrerDetails from "@/components/ReferrerDetails";
import ComorbiditySelector from "@/components/ComorbiditySelector";
import { recognizeVitals } from "@/lib/hiveApi";
import AIBadge from "@/components/AIBadge";
import RequiredInfoChecklist from "@/components/RequiredInfoChecklist";
import ReasoningBullets from "@/components/ReasoningBullets";
import SelectSheet from "@/components/SelectSheet";
import { Camera, Loader2, AlertTriangle, Stethoscope, Activity, Send, Phone, FlaskConical, Pill, ClipboardList, ChevronDown, ChevronUp, Info } from "lucide-react";

const TOP_10 = [
  "T2DM", "Hypertension", "Atrial Fibrillation", "IHD", "CKD",
  "COPD", "Dementia", "Frailty", "Anticoagulated", "Steroid-dependent",
];

const FULL_LIST = [
  "Type 1 DM", "Heart Failure", "Asthma", "OSA", "Parkinson's",
  "Stroke/TIA", "Cirrhosis", "PUD", "IBD", "Hypothyroid",
  "Osteoporosis", "Active Cancer", "Immunosuppressed", "Smoker",
  "Ex-smoker", "Alcohol excess", "Obesity",
];

const SYMPTOM_GROUPS = [
  {
    title: "Post-Op Complications",
    items: [
      "Fever / pyrexia",
      "Wound erythema / discharge",
      "Wound dehiscence",
      "Oozing from wound / drain",
      "Surgical site pain (increasing)",
      "Severe pain (out of proportion)",
      "Haematoma / swelling",
      "Anastomotic leak concern",
      "Ileus / not passing flatus",
      "Bowel obstruction signs",
    ],
  },
  {
    title: "Cardiopulmonary",
    items: [
      "Tachycardia",
      "Hypotension",
      "Shortness of breath",
      "Chest pain",
      "Unilateral leg swelling (DVT)",
      "Reduced SpO₂",
      "Calf tenderness",
      "New AF / arrhythmia",
    ],
  },
  {
    title: "Renal / Fluids",
    items: [
      "Reduced urine output",
      "Oliguria / dark urine",
      "Dehydration signs",
      "Fluid overload / oedema",
      " catheter not draining",
    ],
  },
  {
    title: "Geriatric-Specific",
    items: [
      "Acute confusion / delirium",
      "Agitation / restlessness",
      "Drowsiness / reduced GCS",
      "Fall from bed / chair",
      "Reduced mobility",
      "Incontinence (new)",
      "Pressure injury concern",
      "Failure to eat / drink",
      "Medication adverse effect",
      "Alcohol withdrawal signs",
    ],
  },
  {
    title: "GI / Abdominal",
    items: [
      "Abdominal pain",
      "Abdominal distension",
      "Nausea / vomiting",
      "Constipation",
      "Diarrhoea",
      "NG tube output (high)",
      "Vomiting (bilious)",
    ],
  },
  {
    title: "Preop / Geriatric Pathology",
    items: [
      "Hip / NOF pain (post-fall)",
      "Limb deformity / shortening",
      "Pathological fracture concern",
      "Sepsis / source unknown",
      "Urinary tract infection",
      "Pneumonia / chest infection",
      "Electrolyte imbalance",
      "Acute kidney injury",
      "Delirium with infection",
      "Falls (mechanical vs medical)",
    ],
  },
];

const GERIATRIC_OPTIONS = [
  { value: "Not applicable — not geriatric", label: "Not applicable — not geriatric" },
  { value: "Orthogeriatric review completed", label: "Orthogeriatric review completed" },
  { value: "Pre-op optimization in progress", label: "Pre-op optimization in progress" },
  { value: "Optimized — awaiting surgery", label: "Optimized — awaiting surgery" },
  { value: "Not yet optimized", label: "Not yet optimized" },
  { value: "Post-op — under orthogeriatric care", label: "Post-op — under orthogeriatric care" },
];

const AVPU_OPTIONS = [
  { value: "A", label: "Alert" },
  { value: "V", label: "Voice" },
  { value: "P", label: "Pain" },
  { value: "U", label: "Unresponsive" },
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
  const [onCallTeam, setOnCallTeam] = useState(null);
  const [referrerInfo, setReferrerInfo] = useState({});
  const [comorbidities, setComorbidities] = useState("");
  const [selectedComorbidities, setSelectedComorbidities] = useState([]);
  const [geriatricOptimized, setGeriatricOptimized] = useState("");
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

  const toggleComorbidity = (c) => {
    setSelectedComorbidities(prev => {
      const next = prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c];
      setComorbidities(next.join(", "));
      return next;
    });
  };

  const selectAllSymptoms = (group) => {
    setSelectedSymptoms(prev => {
      const set = new Set(prev);
      group.items.forEach(s => set.add(s));
      return Array.from(set);
    });
  };

  const clearSymptoms = (group) => {
    setSelectedSymptoms(prev => {
      const groupSet = new Set(group.items);
      return prev.filter(s => !groupSet.has(s));
    });
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
      const info = `${patientInfo.name}, MRN: ${patientInfo.mrn}, DOB: ${patientInfo.dob}, Ward: ${patientInfo.ward}, Procedure: ${patientInfo.procedure || "N/A"}, POD: ${patientInfo.pod || "N/A"}${comorbidities ? `, Comorbidities: ${comorbidities}` : ""}${geriatricOptimized ? `, Geriatric Status: ${geriatricOptimized}` : ""}`;
      const fullNarrative = [nurseNarrative.trim(), selectedSymptoms.length > 0 ? `Reported symptoms: ${selectedSymptoms.join(", ")}` : ""].filter(Boolean).join("\n");
      const result = await processINEWSConsult(inewsData, info, patientPhoto ? [patientPhoto] : [], labResults, kardexData, fullNarrative, referrerInfo, comorbidities, geriatricOptimized);
      setResult(result);

      const mrn = patientInfo.mrn || "";
      let patientId = null;

      // Cloud memory: find or create Patient record by MRN
      if (mrn) {
        try {
          const existingPatients = await base44.entities.Patient.filter({ mrn }, "-created_date", 1);
          if (existingPatients.length > 0) {
            patientId = existingPatients[0].id;
            await base44.entities.Patient.update(patientId, {
              name: patientInfo.name || existingPatients[0].name,
              dob: patientInfo.dob || existingPatients[0].dob,
              hospital: user?.hospital || existingPatients[0].hospital,
              ward: patientInfo.ward || existingPatients[0].ward,
            });
          } else {
            const newPatient = await base44.entities.Patient.create({
              name: patientInfo.name || "Unknown",
              dob: patientInfo.dob || null,
              mrn: mrn,
              hospital: user?.hospital || "",
              department: user?.department || "general_surgery",
              ward: patientInfo.ward || "",
            });
            patientId = newPatient.id;
          }
        } catch (err) {
          console.error("Patient link error:", err);
        }
      }

      const caseData = {
        patient_name: patientInfo.name || "Unknown",
        patient_mrn: mrn,
        patient_dob: patientInfo.dob,
        patient_id: patientId,
        hospital: user?.hospital || "",
        department: user?.department || "general_surgery",
        specialty: result.escalate_to && result.escalate_to !== "No escalation — routine ward review" ? result.escalate_to : "",
        status: "inews_consult",
        inews_score: inewsData.calculated_score,
        inews_data: inewsData,
        referral_summary: result.referral_summary || `Inpatient Consult — INEWS ${inewsData.calculated_score}. Nurse concern: ${fullNarrative || "See vitals"}`,
        presenting_complaint: `INEWS ${inewsData.calculated_score} — ${selectedSymptoms.join(", ") || "Inpatient consult"}`,
        kardex_data: kardexData,
        ward: patientInfo.ward,
        triage_decision: result.escalate_to && result.escalate_to !== "No escalation — routine ward review" ? "accept" : "pending",
        triage_reasoning: result.clinical_impression || "",
        accepting_specialty: result.escalate_to || "",
        on_call_consultant: onCallTeam?.consultant_name || "",
        on_call_registrar: onCallTeam?.registrar_name || "",
        on_call_sho: onCallTeam?.sho_name || "",
        referrer_name: referrerInfo.referrer_name || "",
        referrer_grade: referrerInfo.referrer_grade || "",
        referrer_department: referrerInfo.referrer_department || "",
        referrer_contact: referrerInfo.referrer_contact || "",
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
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Phone className="w-5 h-5 text-hive-gold" />
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Inpatient Consult</h1>
        </div>
        <p className="text-sm text-muted-foreground">Ward nurse referral for post-operative inpatient concerns — structured intake with vitals, labs & kardex</p>
      </div>

      <div className="mb-4">
        <OnCallTeamBar department={user?.department} onTeamChange={setOnCallTeam} />
      </div>

      <div className="mb-4">
        <ReferrerDetails value={referrerInfo} onChange={setReferrerInfo} />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <ComorbiditySelector
                  selected={selectedComorbidities}
                  onToggle={toggleComorbidity}
                  onClearAll={() => { setSelectedComorbidities([]); setComorbidities(""); }}
                  onSelectAll={() => {
                    const all = [...TOP_10, ...FULL_LIST];
                    setSelectedComorbidities(all);
                    setComorbidities(all.join(", "));
                  }}
                />
                <input
                  type="text"
                  value={comorbidities}
                  onChange={(e) => { setComorbidities(e.target.value); setSelectedComorbidities([]); }}
                  placeholder="Or type custom comorbidities…"
                  className="mt-2 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Geriatric Optimization</label>
                <SelectSheet
                  value={geriatricOptimized}
                  options={GERIATRIC_OPTIONS}
                  onChange={(v) => setGeriatricOptimized(v)}
                  placeholder="Select if applicable…"
                  label="Geriatric Optimization"
                />
              </div>
            </div>

            {/* Key Comorbidities — prominent visible summary */}
            {(selectedComorbidities.length > 0 || comorbidities.trim()) && (
              <div className="mt-4 rounded-xl border-2 border-hive-gold/25 bg-hive-gold/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-hive-gold" />
                  <p className="text-xs font-bold text-hive-gold uppercase tracking-wider">Key Comorbidities</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(selectedComorbidities.length > 0 ? selectedComorbidities : comorbidities.split(",").map(s => s.trim()).filter(Boolean)).map((c, i) => (
                    <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-destructive/15 text-destructive border border-destructive/30 text-sm font-semibold">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nurse Referral Narrative */}
          <Section title="Nurse Referral — What's the concern?" icon={Phone} open={sections.narrative} onToggle={() => toggleSection("narrative")}>
            <p className="text-xs text-muted-foreground mb-3">Document what the nurse is reporting — symptoms grouped by system. Tap relevant symptoms or type the narrative.</p>
            <div className="space-y-3 mb-3">
              {SYMPTOM_GROUPS.map(group => {
                const allSelected = group.items.every(s => selectedSymptoms.includes(s));
                const noneSelected = group.items.every(s => !selectedSymptoms.includes(s));
                return (
                <div key={group.title}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] font-bold text-accent uppercase tracking-wider">{group.title}</p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => selectAllSymptoms(group)}
                        disabled={allSelected}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 disabled:opacity-30 transition-colors"
                      >
                        All Yes
                      </button>
                      <button
                        onClick={() => clearSymptoms(group)}
                        disabled={noneSelected}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-success/10 text-success border border-success/20 hover:bg-success/20 disabled:opacity-30 transition-colors"
                      >
                        All No
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map(s => (
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
                </div>
                );
              })}
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
              <VitalsInput label="HR (bpm)" value={vitals.hr} onChange={v => setVitals(p => ({ ...p, hr: v }))} quickValues={["60", "80", "100", "120", "140"]} />
              <VitalsInput label="BP Sys" value={vitals.bp_sys} onChange={v => setVitals(p => ({ ...p, bp_sys: v }))} quickValues={["100", "120", "140", "160", "180"]} />
              <VitalsInput label="BP Dia" value={vitals.bp_dia} onChange={v => setVitals(p => ({ ...p, bp_dia: v }))} quickValues={["60", "70", "80", "90", "100"]} />
              <VitalsInput label="RR (/min)" value={vitals.rr} onChange={v => setVitals(p => ({ ...p, rr: v }))} quickValues={["12", "16", "20", "24", "30"]} />
              <VitalsInput label="SpO₂ (%)" value={vitals.spO2} onChange={v => setVitals(p => ({ ...p, spO2: v }))} quickValues={["88", "92", "94", "96", "98"]} />
              <VitalsInput label="Temp (°C)" value={vitals.temp} onChange={v => setVitals(p => ({ ...p, temp: v }))} quickValues={["36.0", "36.5", "37.5", "38.5", "39.5"]} />
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">AVPU</label>
                <SelectSheet
                  value={vitals.avpu}
                  options={AVPU_OPTIONS}
                  onChange={(v) => setVitals(p => ({ ...p, avpu: v }))}
                  placeholder="Select…"
                  label="AVPU"
                />
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

          {result.clinical_impression && (
            <div className="bg-card border-2 border-hive-gold/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="w-4 h-4 text-hive-gold" />
                <h4 className="font-bold text-foreground text-sm">Clinical Impression</h4>
              </div>
              <ReasoningBullets text={result.clinical_impression} />
            </div>
          )}

          {result.escalate_to && (
            <div className={`rounded-xl p-4 border flex items-center gap-3 ${
              result.escalate_to === "No escalation — routine ward review"
                ? "bg-success/10 border-success/30"
                : "bg-destructive/10 border-destructive/30"
            }`}>
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${result.escalate_to === "No escalation — routine ward review" ? "text-success" : "text-destructive"}`} />
              <div>
                <p className={`text-sm font-bold ${result.escalate_to === "No escalation — routine ward review" ? "text-success" : "text-destructive"}`}>
                  {result.escalate_to === "No escalation — routine ward review" ? "No Escalation Required" : `Escalate to: ${result.escalate_to}`}
                </p>
                {result.escalation_recommendation && (
                  <p className="text-xs text-muted-foreground mt-0.5">{result.escalation_recommendation}</p>
                )}
              </div>
            </div>
          )}

          {result.referral_summary && (
            <div className="bg-card border-2 border-accent/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-accent" />
                  <h4 className="font-bold text-foreground text-sm">Referral Summary</h4>
                </div>
                <button
                  onClick={() => {
                    const el = document.createElement("textarea");
                    el.value = result.referral_summary;
                    document.body.appendChild(el);
                    el.select();
                    document.execCommand("copy");
                    document.body.removeChild(el);
                  }}
                  className="text-xs text-hive-gold hover:underline"
                >
                  Copy
                </button>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{result.referral_summary}</p>
            </div>
          )}

          {result.sbar_summary && <ResultSection title={inewsScore === 0 ? "Summary" : "SBAR Summary"} icon={Send} content={result.sbar_summary} />}
          {result.differentials && <ResultSectionBullets title="Differential Diagnoses" icon={Stethoscope} content={result.differentials} />}
          {result.immediate_management && <ResultSectionBullets title="Immediate Management" icon={Activity} content={result.immediate_management} />}
          {result.investigation_recommendations && <ResultSectionBullets title="Investigations" icon={Activity} content={result.investigation_recommendations} />}
          {result.plan && <ResultSectionBullets title="Management Plan" icon={ClipboardList} content={result.plan} />}
          {result.recommendations && <ResultSectionBullets title="Recommendations for Ward Team" icon={Activity} content={result.recommendations} />}

          {result.required_info && (
            <div className="bg-card border border-border rounded-xl p-4">
              <RequiredInfoChecklist requiredInfo={result.required_info} />
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

function ResultSectionBullets({ title, icon: Icon, content }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-hive-gold" />
        <h4 className="font-semibold text-foreground text-sm">{title}</h4>
      </div>
      <ReasoningBullets text={content} />
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

function VitalsInput({ label, value, onChange, quickValues = [] }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
      />
      <div className="flex flex-wrap gap-1 mt-1">
        {quickValues.map(qv => (
          <button
            key={qv}
            onClick={() => onChange(qv)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
              value === qv
                ? "bg-hive-gold/20 text-hive-gold border border-hive-gold/30"
                : "bg-secondary text-muted-foreground border border-border hover:text-foreground"
            }`}
          >
            {qv}
          </button>
        ))}
      </div>
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