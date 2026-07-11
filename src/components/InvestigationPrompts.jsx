import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { generateAdmissionNote } from "@/lib/hiveApi";
import AIBadge from "@/components/AIBadge";
import { Loader2, ClipboardList, FileText, FlaskConical, Scan } from "lucide-react";
import ShareNoteButtons from "@/components/ShareNoteButtons";
import FormattedAdmissionNote from "@/components/FormattedAdmissionNote";

const BLOOD_INVESTIGATIONS = [
  "FBC", "UEC", "LFTs", "CRP", "Coagulation / INR", "Group & Save",
  "Amylase", "Lactate", "β-hCG (if female)", "Troponin", "D-dimer",
  "Blood cultures", "VBG / ABG", "Calcium", "Magnesium", "Phosphate",
];

const IMAGING_OPTIONS = [
  "X-ray: AP + Lateral (affected area)", "X-ray: AP Pelvis", "X-ray: Chest",
  "CT Abdomen/Pelvis (with contrast)", "CT Chest", "CT Head", "CTPA",
  "Ultrasound Abdomen", "MRCP", "MRI (specify region)", "Doppler USS",
  "ECG", "Bedside USS (FAST scan)",
];

export default function InvestigationPrompts({ caseData, caseId, onUpdate }) {
  const [selectedBloods, setSelectedBloods] = useState([]);
  const [selectedImaging, setSelectedImaging] = useState([]);
  const [comorbidities, setComorbidities] = useState("");
  const [admissionNote, setAdmissionNote] = useState(caseData.admission_note || "");
  const [generating, setGenerating] = useState(false);

  const toggleBlood = (item) => {
    setSelectedBloods(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };
  const toggleImaging = (item) => {
    setSelectedImaging(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateAdmissionNote(caseData, selectedBloods, selectedImaging, comorbidities);
      const note = typeof result === "string" ? result : (result.admission_note || "");
      setAdmissionNote(note);
      await base44.entities.CaseFile.update(caseId, { admission_note: note });
      onUpdate();
    } catch {
      alert("Failed to generate admission note.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Investigations & Admission Note</h3>
        <p className="text-xs text-muted-foreground">Tick the relevant boxes — AI compiles a ready-to-use admission note with plan.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className="w-4 h-4 text-hive-gold" />
          <h4 className="font-semibold text-foreground text-sm">Blood Investigations</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {BLOOD_INVESTIGATIONS.map(item => (
            <button
              key={item}
              onClick={() => toggleBlood(item)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedBloods.includes(item)
                  ? "bg-hive-gold/15 text-hive-gold border border-hive-gold/30"
                  : "bg-secondary text-muted-foreground border border-border hover:text-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Scan className="w-4 h-4 text-hive-gold" />
          <h4 className="font-semibold text-foreground text-sm">Imaging & Investigations</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {IMAGING_OPTIONS.map(item => (
            <button
              key={item}
              onClick={() => toggleImaging(item)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedImaging.includes(item)
                  ? "bg-hive-gold/15 text-hive-gold border border-hive-gold/30"
                  : "bg-secondary text-muted-foreground border border-border hover:text-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <label className="text-xs font-medium text-muted-foreground block mb-1">Comorbidities (for admission note)</label>
        <textarea
          value={comorbidities}
          onChange={(e) => setComorbidities(e.target.value)}
          rows={2}
          placeholder="e.g. T2DM, HTN, AF on warfarin, CKD stage 3, ex-smoker"
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50 resize-none"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full px-4 py-3 rounded-lg bg-hive-gold text-hive-gold-foreground font-semibold text-sm hover:bg-hive-gold/90 flex items-center justify-center gap-2"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
        {admissionNote ? "Re-generate Admission Note with Latest Info" : "Generate Admission Note with Plan"}
      </button>

      {admissionNote && (
        <div className="bg-card border-2 border-hive-gold/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-hive-gold" />
              <h4 className="font-bold text-foreground text-sm">Admission Note with Plan</h4>
            </div>
            <div className="flex items-center gap-2">
              <AIBadge />
              <ShareNoteButtons
                note={admissionNote}
                patientName={caseData.patient_name}
                onRegenerate={handleGenerate}
                generating={generating}
              />
            </div>
          </div>
          <FormattedAdmissionNote note={admissionNote} />
        </div>
      )}
    </div>
  );
}