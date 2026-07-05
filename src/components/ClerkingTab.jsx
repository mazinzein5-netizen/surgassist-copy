import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { uploadFile } from "@/lib/hiveApi";
import { Loader2, Camera, Stethoscope, Activity, Eye, Hand, AlertTriangle } from "lucide-react";
import OrthoProforma from "@/components/OrthoProforma";
import InvestigationPrompts from "@/components/InvestigationPrompts";
import PeriopAlertsPanel from "@/components/PeriopAlertsPanel";
import { ExamGuideSection, DermatomeMap, MyotomeGuide, ReflexGuide, AbdominalExamGuide, VascularExamGuide, WoundAssessmentGuide } from "@/components/ExamGuides";

export default function ClerkingTab({ caseData, photos, caseId, onPhotoAdded }) {
  const [photoType, setPhotoType] = useState("wound");
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadResult = await uploadFile(file);
      await base44.entities.ClinicalPhoto.create({
        case_id: caseId,
        photo_type: photoType,
        photo_url: uploadResult.file_url,
        caption: "",
      });
      onPhotoAdded();
    } catch {
      alert("Failed to upload photo.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Yes/No Proforma */}
      <OrthoProforma caseData={caseData} caseId={caseId} onUpdate={onPhotoAdded} />

      {/* Perioperative Safety Alerts */}
      <PeriopAlertsWrapper caseData={caseData} />

      {/* Clinical Photos quick upload */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Clinical Photos</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={photoType}
            onChange={(e) => setPhotoType(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
          >
            <option value="wound">Wound</option>
            <option value="xray">X-Ray</option>
            <option value="ecg">ECG</option>
            <option value="medication_list">Medication List</option>
            <option value="other">Other</option>
          </select>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            Add Photo
          </button>
        </div>
        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
            {photos.map(p => (
              <div key={p.id} className="relative group">
                <img src={p.photo_url} alt={p.photo_type} className="w-full h-32 rounded-lg object-cover border border-border" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm rounded-b-lg px-2 py-1">
                  <span className="text-[10px] text-white capitalize">{p.photo_type.replace("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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