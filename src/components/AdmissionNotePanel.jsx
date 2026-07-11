import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { generateAdmissionNote } from "@/lib/hiveApi";
import { compileProformaLines } from "@/components/OrthoProforma";
import { Loader2, FileText, X, Save, RefreshCw, Lock, FlaskConical, Scan, Pill, Activity } from "lucide-react";
import AIBadge from "@/components/AIBadge";
import FormattedAdmissionNote from "@/components/FormattedAdmissionNote";
import { downloadAdmissionNotePDF } from "@/lib/pdfExport";

export default function AdmissionNotePanel({ caseData, caseId, onClose, onUpdate }) {
  const { user } = useAuth();
  const [selectedBloods, setSelectedBloods] = useState([]);
  const [selectedImaging, setSelectedImaging] = useState([]);
  const [comorbidities, setComorbidities] = useState("");
  const [note, setNote] = useState(caseData.admission_note || "");
  const [editing, setEditing] = useState(false);
  const [editedNote, setEditedNote] = useState(note);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pre-populate from existing investigation_data
  useEffect(() => {
    const invData = caseData.investigation_data || {};
    if (Array.isArray(invData.bloods) && invData.bloods.length > 0) {
      setSelectedBloods(invData.bloods);
    }
    if (Array.isArray(invData.imaging) && invData.imaging.length > 0) {
      setSelectedImaging(invData.imaging);
    }
  }, [caseData.id]);

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
      const generated = typeof result === "string" ? result : (result.admission_note || "");
      setNote(generated);
      setEditedNote(generated);
      await base44.entities.CaseFile.update(caseId, {
        admission_note: generated,
        investigation_data: { bloods: selectedBloods, imaging: selectedImaging },
      });
      onUpdate();
    } catch {
      alert("Failed to generate admission note.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToRecord = async () => {
    const finalNote = editing ? editedNote : note;
    if (!finalNote) return;
    setSaving(true);
    try {
      // Save to case file
      await base44.entities.CaseFile.update(caseId, {
        admission_note: finalNote,
        investigation_data: { bloods: selectedBloods, imaging: selectedImaging },
        status: caseData.status === "referral_intake" || caseData.status === "triage" || caseData.status === "accepted" ? "admitted" : caseData.status,
        admission_date: caseData.admission_date || new Date().toISOString(),
        note_author_name: user?.full_name || "Unknown",
        note_author_grade: user?.clinical_grade || "nchd",
        note_author_imc: user?.imc_number || "",
        note_locked_at: new Date().toISOString(),
      });

      // Create locked admission CaseNote as permanent online record
      await base44.entities.CaseNote.create({
        case_id: caseId,
        patient_id: caseData.patient_id || "",
        note_type: "admission",
        content: finalNote,
        author_name: user?.full_name || "Unknown",
        author_id: user?.id || "",
        author_grade: user?.clinical_grade || "nchd",
        author_imc: user?.imc_number || "",
        is_locked: true,
      });

      setNote(finalNote);
      setEditing(false);
      onUpdate();
      onClose();
    } catch {
      alert("Failed to save admission note to patient record.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = () => {
    setNote(editedNote);
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl my-8" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-900" />
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Formulate Admission Note</h2>
              <p className="text-xs text-gray-500">{caseData.patient_name}{caseData.patient_mrn ? ` · MRN: ${caseData.patient_mrn}` : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Investigation selectors */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Blood Investigations</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["FBC", "UEC", "LFTs", "CRP", "Coagulation / INR", "Group & Save", "Amylase", "Lactate", "β-hCG", "Troponin", "D-dimer", "Blood cultures", "VBG / ABG", "Calcium", "Magnesium", "Phosphate"].map(item => (
                <button key={item} onClick={() => toggleBlood(item)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    selectedBloods.includes(item)
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Scan className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Imaging & Investigations</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["X-ray: AP + Lateral", "X-ray: AP Pelvis", "X-ray: Chest", "CT Abdomen/Pelvis", "CT Chest", "CT Head", "CTPA", "Ultrasound Abdomen", "MRCP", "MRI", "Doppler USS", "ECG", "FAST scan"].map(item => (
                <button key={item} onClick={() => toggleImaging(item)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    selectedImaging.includes(item)
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Comorbidities</label>
            <textarea value={comorbidities} onChange={(e) => setComorbidities(e.target.value)} rows={2}
              placeholder="e.g. T2DM, HTN, AF on warfarin, CKD stage 3"
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 resize-none" />
          </div>

          {/* Generate button */}
          <button onClick={handleGenerate} disabled={generating}
            className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {note ? "Re-generate with Latest Data" : "Generate Admission Note"}
          </button>

          {/* Note preview */}
          {note && (
            <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AIBadge />
                  <h4 className="font-bold text-gray-900 text-sm">Admission Note</h4>
                  {editing ? (
                    <button onClick={handleSaveEdit} className="text-xs text-blue-600 hover:underline ml-2">Done editing</button>
                  ) : (
                    <button onClick={() => { setEditedNote(note); setEditing(true); }} className="text-xs text-blue-600 hover:underline ml-2">Edit</button>
                  )}
                </div>
                <button onClick={() => downloadAdmissionNotePDF(caseData, note)} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200" title="Download PDF">
                  <FileText className="w-4 h-4" />
                </button>
              </div>
              {editing ? (
                <textarea value={editedNote} onChange={(e) => setEditedNote(e.target.value)} rows={20}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono resize-y focus:outline-none focus:border-gray-400" />
              ) : (
                <FormattedAdmissionNote note={note} />
              )}
            </div>
          )}

          {/* Save to record */}
          {note && (
            <button onClick={handleSaveToRecord} disabled={saving}
              className="w-full px-4 py-3 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Save to Patient Record (Locked)
            </button>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            Saved admission notes become a permanent locked entry in the patient's online record.
          </p>
        </div>
      </div>
    </div>
  );
}