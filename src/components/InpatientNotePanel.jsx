import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { generateInpatientNote } from "@/lib/hiveApi";
import { Loader2, FileText, X, Save, RefreshCw, Lock, FlaskConical, Scan, Pill, Activity, ChevronDown, ChevronUp } from "lucide-react";
import AIBadge from "@/components/AIBadge";
import FormattedAdmissionNote from "@/components/FormattedAdmissionNote";

export default function InpatientNotePanel({ caseData, caseId, onClose, onUpdate }) {
  const { user } = useAuth();
  const [labResults, setLabResults] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [editedNote, setEditedNote] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showData, setShowData] = useState(false);

  useEffect(() => {
    loadData();
  }, [caseId]);

  const loadData = async () => {
    try {
      const labs = await base44.entities.LabResult.filter({ case_id: caseId }, "-collected_at", 50);
      setLabResults(labs);
    } catch {}
    try {
      const photoData = await base44.entities.ClinicalPhoto.filter({ case_id: caseId });
      setPhotos(photoData);
    } catch {}
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const generated = await generateInpatientNote(caseData, labResults, photos, user);
      setNote(generated);
      setEditedNote(generated);
    } catch {
      alert("Failed to generate inpatient note.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToRecord = async () => {
    const finalNote = editing ? editedNote : note;
    if (!finalNote) return;
    setSaving(true);
    try {
      await base44.entities.CaseNote.create({
        case_id: caseId,
        patient_id: caseData.patient_id || "",
        note_type: "review",
        content: finalNote,
        author_name: user?.full_name || "Unknown",
        author_id: user?.id || "",
        author_grade: user?.clinical_grade || "nchd",
        author_imc: user?.imc_number || "",
        is_locked: false,
      });

      setNote(finalNote);
      setEditing(false);
      onUpdate();
      onClose();
    } catch {
      alert("Failed to save inpatient note to patient record.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = () => {
    setNote(editedNote);
    setEditing(false);
  };

  // Group lab results by test type for display
  const labsByType = labResults.reduce((acc, lab) => {
    if (!acc[lab.test_type]) acc[lab.test_type] = [];
    acc[lab.test_type].push(lab);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl my-8" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-900" />
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Inpatient Progress Note</h2>
              <p className="text-xs text-gray-500">{caseData.patient_name}{caseData.patient_mrn ? ` · MRN: ${caseData.patient_mrn}` : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Clinical context summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Ward/Bed</p>
                <p className="font-medium text-gray-900">{caseData.ward || "—"}{caseData.bed_number ? ` / ${caseData.bed_number}` : ""}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Post-Op Status</p>
                <p className="font-medium text-gray-900 capitalize">{(caseData.pre_op_status || "—").replace(/_/g, " ")}{caseData.pod != null ? ` · POD ${caseData.pod}` : ""}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Procedure</p>
                <p className="font-medium text-gray-900">{caseData.procedure_name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">INEWS Score</p>
                <p className="font-medium text-gray-900">{caseData.inews_score ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* Collapsible data sources */}
          <button onClick={() => setShowData(!showData)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
            <span className="flex items-center gap-2">
              {showData ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Data Sources ({labResults.length} labs, {photos.length} images)
            </span>
          </button>

          {showData && (
            <div className="space-y-3">
              {/* Lab results */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FlaskConical className="w-4 h-4 text-gray-500" />
                  <h4 className="font-semibold text-gray-900 text-sm">Lab Results</h4>
                </div>
                {labResults.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No lab results on file</p>
                ) : (
                  <div className="space-y-1.5">
                    {Object.entries(labsByType).map(([testType, results]) => (
                      <div key={testType} className="flex items-center gap-2 text-xs">
                        <span className="font-medium text-gray-700 capitalize w-32">{testType}</span>
                        {results.map((r, i) => (
                          <span key={i} className="text-gray-600">
                            {r.value}{r.unit || ""} <span className="text-gray-400">({new Date(r.collected_at).toLocaleDateString("en-IE")})</span>
                            {i < results.length - 1 && " · "}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Imaging */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Scan className="w-4 h-4 text-gray-500" />
                  <h4 className="font-semibold text-gray-900 text-sm">Imaging & Clinical Photos</h4>
                </div>
                {photos.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No imaging on file</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map(p => (
                      <div key={p.id} className="relative">
                        <img src={p.photo_url} alt={p.photo_type} className="w-full h-16 rounded-lg object-cover border border-gray-200" />
                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-white px-1 py-0.5 rounded-b-lg capitalize">{p.photo_type.replace(/_/g, " ")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Medications */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Pill className="w-4 h-4 text-gray-500" />
                  <h4 className="font-semibold text-gray-900 text-sm">Current Medications</h4>
                </div>
                {caseData.kardex_data?.medications?.length > 0 ? (
                  <div className="space-y-0.5">
                    {caseData.kardex_data.medications.map((m, i) => (
                      <p key={i} className="text-xs text-gray-700">{m.drug} {m.dose} {m.route} {m.frequency}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No kardex data</p>
                )}
              </div>
            </div>
          )}

          {/* Generate button */}
          <button onClick={handleGenerate} disabled={generating}
            className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {note ? "Re-generate Inpatient Note" : "Generate Inpatient Progress Note"}
          </button>

          {/* Note preview */}
          {note && (
            <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AIBadge />
                  <h4 className="font-bold text-gray-900 text-sm">Inpatient Progress Note</h4>
                  {editing ? (
                    <button onClick={handleSaveEdit} className="text-xs text-blue-600 hover:underline ml-2">Done editing</button>
                  ) : (
                    <button onClick={() => { setEditedNote(note); setEditing(true); }} className="text-xs text-blue-600 hover:underline ml-2">Edit</button>
                  )}
                </div>
              </div>
              {editing ? (
                <textarea value={editedNote} onChange={(e) => setEditedNote(e.target.value)} rows={24}
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
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save to Patient Record
            </button>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <FileText className="w-3 h-3" />
            Inpatient notes are saved as review entries in the patient's chronological record.
          </p>
        </div>
      </div>
    </div>
  );
}