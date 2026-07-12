import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { uploadFile } from "@/lib/hiveApi";
import { Loader2, Camera, Stethoscope, Activity, Eye, Hand, AlertTriangle } from "lucide-react";
import AIBadge from "@/components/AIBadge";
import OrthoProforma from "@/components/OrthoProforma";
import InvestigationPrompts from "@/components/InvestigationPrompts";
import PeriopAlertsPanel from "@/components/PeriopAlertsPanel";
import ProformaContextBanner from "@/components/ProformaContextBanner";
import { ExamGuideSection, DermatomeMap, MyotomeGuide, ReflexGuide, AbdominalExamGuide, VascularExamGuide, WoundAssessmentGuide } from "@/components/ExamGuides";

export default function ClerkingTab({ caseData, photos, caseId, onPhotoAdded, onProformaSaved }) {
  return (
    <div className="space-y-4">
      {/* Tailored context banner */}
      <ProformaContextBanner caseData={caseData} />

      {/* Yes/No Proforma */}
      <OrthoProforma caseData={caseData} caseId={caseId} onUpdate={onPhotoAdded} onSaved={onProformaSaved} />

      {/* Perioperative Safety Alerts */}
      <PeriopAlertsWrapper caseData={caseData} />

      {/* Clinical Photos gallery */}
      {photos.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Clinical Photos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map(p => (
              <div key={p.id} className="relative group">
                <img src={p.photo_url} alt={p.photo_type} className="w-full h-32 rounded-lg object-cover border border-border" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm rounded-b-lg px-2 py-1">
                  <span className="text-[10px] text-white capitalize">{p.photo_type.replace("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investigations & Admission Note */}
      <InvestigationPrompts caseData={caseData} caseId={caseId} onUpdate={onPhotoAdded} />

      {/* Exam Guides */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Clinical Examination Guides</h3>
        <p className="text-xs text-muted-foreground">Interactive reference diagrams validated against RCSI curriculum.</p>
        <ExamGuideSection title="Dermatome Map — Sensory Testing" icon={Eye}>
          <DermatomeMap />
        </ExamGuideSection>
        <ExamGuideSection title="Myotome Guide — Motor Testing" icon={Hand}>
          <MyotomeGuide />
        </ExamGuideSection>
        <ExamGuideSection title="Deep Tendon Reflexes" icon={Activity}>
          <ReflexGuide />
        </ExamGuideSection>
        <ExamGuideSection title="Abdominal Examination" icon={Stethoscope}>
          <AbdominalExamGuide />
        </ExamGuideSection>
        <ExamGuideSection title="Vascular Examination" icon={Activity}>
          <VascularExamGuide />
        </ExamGuideSection>
        <ExamGuideSection title="Wound Assessment" icon={AlertTriangle}>
          <WoundCameraCapture caseId={caseId} onPhotoAdded={onPhotoAdded} />
          <WoundAssessmentGuide />
        </ExamGuideSection>
      </div>
    </div>
  );
}

function PeriopAlertsWrapper({ caseData }) {
  // Extract anticoagulant meds from proforma_data
  let meds = [];
  let comorbidities = "";

  if (caseData.proforma_data) {
    for (const [key, entry] of Object.entries(caseData.proforma_data)) {
      if (key.includes("On anticoagulants") && entry.answer === "yes" && entry.meds) {
        meds = entry.meds;
      }
      if (key.includes("Diabetic") && entry.answer === "yes" && entry.meds) {
        meds = [...meds, ...entry.meds];
      }
    }
  }

  // Extract comorbidities from proforma answers
  const pmhFlags = [];
  for (const [key, entry] of Object.entries(caseData.proforma_data || {})) {
    if (entry.answer === "yes") {
      if (key.includes("Diabetic")) pmhFlags.push("T2DM");
      if (key.includes("Smoker")) pmhFlags.push("smoker");
      if (key.includes("Osteoporosis")) pmhFlags.push("osteoporosis");
    }
  }

  // Also check kardex_data for medication info
  if (caseData.kardex_data?.medications) {
    const kardexMeds = caseData.kardex_data.medications
      .map(m => `${m.drug} ${m.dose}`)
      .join(", ");
    comorbidities = [pmhFlags.join(", "), kardexMeds].filter(Boolean).join("; ");
  } else {
    comorbidities = pmhFlags.join(", ");
  }

  // Also include admission note comorbidities if available
  if (caseData.kardex_data?.treatment_plan) {
    comorbidities += ` ${caseData.kardex_data.treatment_plan}`;
  }

  return <PeriopAlertsPanel meds={meds} comorbidities={comorbidities} caseData={caseData} />;
}

function WoundCameraCapture({ caseId, onPhotoAdded }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadResult = await uploadFile(file);
      await base44.entities.ClinicalPhoto.create({
        case_id: caseId,
        photo_type: "wound",
        photo_url: uploadResult.file_url,
        caption: "",
      });
      onPhotoAdded();

      // AI evaluation
      setEvaluating(true);
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `You are HIVE Surgical Assistant with expertise in wound and abscess assessment. Analyze this wound image and provide a structured clinical evaluation:

1. WOUND TYPE: e.g., surgical incision, laceration, ulcer, abscess, burn, crush injury
2. SITE: anatomical location if determinable
3. SIZE: estimated dimensions if visible
4. APPEARANCE: describe wound bed, margins, surrounding skin
5. DISCHARGE: serous, serosanguinous, purulent, haemorrhagic
6. SURROUNDING SKIN: erythema, induration, warmth, cellulitis, necrosis
7. SEVERITY: mild, moderate, severe
8. CONCERNS: any signs of infection, necrosis, dehiscence, or abscess formation
9. RECOMMENDATION: brief management recommendation

Be precise and clinically accurate. If image quality is insufficient, state so.`,
          file_urls: [uploadResult.file_url],
          response_json_schema: {
            type: "object",
            properties: {
              wound_type: { type: "string" },
              site: { type: "string" },
              size: { type: "string" },
              appearance: { type: "string" },
              discharge: { type: "string" },
              surrounding_skin: { type: "string" },
              severity: { type: "string", enum: ["mild", "moderate", "severe"] },
              concerns: { type: "string" },
              recommendation: { type: "string" },
            }
          }
        });
        setResult(res);
      } catch {}
    } catch {
      alert("Failed to upload photo.");
    } finally {
      setUploading(false);
      setEvaluating(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="mb-4">
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading || evaluating}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-hive-gold/10 border border-hive-gold/30 text-hive-gold text-xs font-semibold hover:bg-hive-gold/20 disabled:opacity-50 mb-3"
      >
        {uploading || evaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
        {uploading ? "Uploading..." : evaluating ? "Evaluating wound..." : "Capture & Evaluate Wound"}
      </button>

      {result && (
        <div className="bg-background border border-border rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <AIBadge />
            <span className="text-xs font-bold text-foreground">AI Wound Assessment</span>
            {result.severity === "severe" && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-500">SEVERE</span>}
            {result.severity === "moderate" && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500">MODERATE</span>}
          </div>
          {result.wound_type && <p className="text-xs text-foreground"><span className="text-muted-foreground font-semibold">Type:</span> {result.wound_type}</p>}
          {result.site && <p className="text-xs text-foreground"><span className="text-muted-foreground font-semibold">Site:</span> {result.site}</p>}
          {result.size && <p className="text-xs text-foreground"><span className="text-muted-foreground font-semibold">Size:</span> {result.size}</p>}
          {result.appearance && <p className="text-xs text-foreground"><span className="text-muted-foreground font-semibold">Appearance:</span> {result.appearance}</p>}
          {result.discharge && <p className="text-xs text-foreground"><span className="text-muted-foreground font-semibold">Discharge:</span> {result.discharge}</p>}
          {result.surrounding_skin && <p className="text-xs text-foreground"><span className="text-muted-foreground font-semibold">Surrounding skin:</span> {result.surrounding_skin}</p>}
          {result.concerns && <p className="text-xs text-foreground"><span className="text-muted-foreground font-semibold">Concerns:</span> {result.concerns}</p>}
          {result.recommendation && <p className="text-xs text-foreground"><span className="text-muted-foreground font-semibold">Recommendation:</span> {result.recommendation}</p>}
        </div>
      )}
    </div>
  );
}