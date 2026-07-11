import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { generateOperativeNote } from "@/lib/hiveApi";
import { Loader2, FileText, X, RefreshCw, Lock, ChevronDown, ChevronUp, Activity, Scissors, Save } from "lucide-react";
import AIBadge from "@/components/AIBadge";
import FormattedAdmissionNote from "@/components/FormattedAdmissionNote";
import { downloadOperativeNotePDF } from "@/lib/pdfExport";

const ANAESTHETIC_OPTIONS = [
  { value: "general", label: "General" },
  { value: "regional", label: "Regional" },
  { value: "local", label: "Local" },
  { value: "sedation", label: "Sedation" },
  { value: "spinal", label: "Spinal" },
  { value: "epidural", label: "Epidural" },
  { value: "combined", label: "Combined GA + Regional" },
  { value: "other", label: "Other" },
];

export default function OperativeNotePanel({ caseData, caseId, onClose, onUpdate }) {
  const { user } = useAuth();
  const [existingNotes, setExistingNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [editedNote, setEditedNote] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    procedure_name: caseData.procedure_name || "",
    procedure_date: caseData.procedure_date ? new Date(caseData.procedure_date).toISOString().slice(0, 16) : "",
    pre_op_diagnosis: caseData.presenting_complaint || caseData.referral_summary || "",
    post_op_diagnosis: "",
    surgeon_name: caseData.consultant_name || user?.full_name || "",
    surgeon_imc: user?.imc_number || "",
    assistant_names: user?.full_name || "",
    anaesthetist_name: "",
    anaesthetic_type: "general",
    operation_findings: "",
    operation_technique: "",
    closure_method: "",
    blood_loss: "",
    drains: "",
    specimens: "",
    complications: "",
    post_op_plan: caseData.treatment_plan || "",
    antibiotics_given: "",
    dvt_prophylaxis: "LMWH as per VTE protocol",
  });

  useEffect(() => {
    loadNotes();
  }, [caseId]);

  const loadNotes = async () => {
    try {
      const notes = await base44.entities.OperativeNote.filter({ case_id: caseId }, "-procedure_date", 50);
      setExistingNotes(notes);
    } catch {}
    finally { setLoading(false); }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const generated = await generateOperativeNote(caseData, formData, user);
      setNote(generated);
      setEditedNote(generated);
    } catch {
      alert("Failed to generate operative note.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToRecord = async () => {
    const finalNote = editing ? editedNote : note;
    if (!finalNote || !formData.procedure_name) {
      alert("Please enter a procedure name before saving.");
      return;
    }
    setSaving(true);
    try {
      await base44.entities.OperativeNote.create({
        case_id: caseId,
        patient_id: caseData.patient_id || "",
        patient_name: caseData.patient_name || "",
        patient_mrn: caseData.patient_mrn || "",
        procedure_name: formData.procedure_name,
        procedure_date: formData.procedure_date || new Date().toISOString(),
        pre_op_diagnosis: formData.pre_op_diagnosis,
        post_op_diagnosis: formData.post_op_diagnosis,
        surgeon_name: formData.surgeon_name,
        surgeon_imc: formData.surgeon_imc,
        assistant_names: formData.assistant_names,
        anaesthetist_name: formData.anaesthetist_name,
        anaesthetic_type: formData.anaesthetic_type,
        operation_findings: formData.operation_findings,
        operation_technique: formData.operation_technique,
        closure_method: formData.closure_method,
        blood_loss: formData.blood_loss,
        drains: formData.drains,
        specimens: formData.specimens,
        complications: formData.complications,
        post_op_plan: formData.post_op_plan,
        antibiotics_given: formData.antibiotics_given,
        dvt_prophylaxis: formData.dvt_prophylaxis,
        note_content: finalNote,
        author_name: user?.full_name || "Unknown",
        author_id: user?.id || "",
        author_grade: user?.clinical_grade || "nchd",
        author_imc: user?.imc_number || "",
        is_locked: true,
      });

      // Also update the case file with procedure info
      await base44.entities.CaseFile.update(caseId, {
        procedure_name: formData.procedure_name,
        procedure_date: formData.procedure_date ? formData.procedure_date.slice(0, 10) : null,
        pre_op_status: "post_op",
      });

      setNote(finalNote);
      setEditing(false);
      setShowForm(false);
      setNote("");
      await loadNotes();
      onUpdate();
    } catch {
      alert("Failed to save operative note to patient record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl my-8" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-gray-900" />
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Operations & Operative Notes</h2>
              <p className="text-xs text-gray-500">{caseData.patient_name}{caseData.patient_mrn ? ` · MRN: ${caseData.patient_mrn}` : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Existing operative notes */}
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : existingNotes.length > 0 ? (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 text-sm">Operative Notes on Record</h3>
              {existingNotes.map(opNote => (
                <div key={opNote.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{opNote.procedure_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(opNote.procedure_date).toLocaleDateString("en-IE")}
                        {opNote.surgeon_name && ` · Surgeon: ${opNote.surgeon_name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-3 h-3 text-gray-400" />
                      <button onClick={() => downloadOperativeNotePDF(caseData, opNote)} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200" title="Download PDF">
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <FormattedAdmissionNote note={opNote.note_content || opNote.operation_findings || ""} />
                </div>
              ))}
            </div>
          ) : null}

          {/* New note button or form */}
          {!showForm ? (
            <button onClick={() => setShowForm(true)}
              className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 flex items-center justify-center gap-2">
              <Scissors className="w-4 h-4" /> New Operative Note
            </button>
          ) : (
            <div className="space-y-4">
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Operative Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Procedure Name" value={formData.procedure_name} onChange={v => handleChange("procedure_name", v)} placeholder="e.g. ORIF Left Ankle" />
                  <Input label="Procedure Date/Time" type="datetime-local" value={formData.procedure_date} onChange={v => handleChange("procedure_date", v)} />
                  <Input label="Pre-Op Diagnosis" value={formData.pre_op_diagnosis} onChange={v => handleChange("pre_op_diagnosis", v)} />
                  <Input label="Post-Op Diagnosis" value={formData.post_op_diagnosis} onChange={v => handleChange("post_op_diagnosis", v)} />
                  <Input label="Surgeon" value={formData.surgeon_name} onChange={v => handleChange("surgeon_name", v)} />
                  <Input label="Surgeon IMC" value={formData.surgeon_imc} onChange={v => handleChange("surgeon_imc", v)} />
                  <Input label="Assistants" value={formData.assistant_names} onChange={v => handleChange("assistant_names", v)} />
                  <Input label="Anaesthetist" value={formData.anaesthetist_name} onChange={v => handleChange("anaesthetist_name", v)} />
                </div>

                <div className="mt-3">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Anaesthesia Type</label>
                  <select value={formData.anaesthetic_type} onChange={e => handleChange("anaesthetic_type", e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400">
                    {ANAESTHETIC_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                <div className="mt-3 space-y-3">
                  <TextArea label="Operation Findings" value={formData.operation_findings} onChange={v => handleChange("operation_findings", v)} placeholder="e.g. Comminuted fracture of distal fibula, displacement noted, no neurovascular compromise" rows={3} />
                  <TextArea label="Operation Technique" value={formData.operation_technique} onChange={v => handleChange("operation_technique", v)} placeholder="Step-by-step description of the procedure performed" rows={4} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Closure Method" value={formData.closure_method} onChange={v => handleChange("closure_method", v)} placeholder="e.g. Interrupted nylon, continuous PDS" />
                    <Input label="Blood Loss" value={formData.blood_loss} onChange={v => handleChange("blood_loss", v)} placeholder="e.g. 100ml" />
                    <Input label="Drains" value={formData.drains} onChange={v => handleChange("drains", v)} placeholder="e.g. None or drain type/location" />
                    <Input label="Specimens" value={formData.specimens} onChange={v => handleChange("specimens", v)} placeholder="e.g. Bone fragment to histology" />
                  </div>
                  <TextArea label="Complications" value={formData.complications} onChange={v => handleChange("complications", v)} placeholder="Intraoperative complications or None" rows={2} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Antibiotics Given" value={formData.antibiotics_given} onChange={v => handleChange("antibiotics_given", v)} placeholder="e.g. Cefuroxime 1.5g IV at induction" />
                    <Input label="DVT Prophylaxis" value={formData.dvt_prophylaxis} onChange={v => handleChange("dvt_prophylaxis", v)} />
                  </div>
                  <TextArea label="Post-Op Plan" value={formData.post_op_plan} onChange={v => handleChange("post_op_plan", v)} rows={3} />
                </div>
              </div>

              {/* Generate button */}
              <button onClick={handleGenerate} disabled={generating}
                className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Generate Operative Note
              </button>

              {/* Note preview */}
              {note && (
                <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AIBadge />
                      <h4 className="font-bold text-gray-900 text-sm">Operative Note</h4>
                      {editing ? (
                        <button onClick={() => { setNote(editedNote); setEditing(false); }} className="text-xs text-blue-600 hover:underline ml-2">Cancel</button>
                      ) : (
                        <button onClick={() => { setEditedNote(note); setEditing(true); }} className="text-xs text-blue-600 hover:underline ml-2">Edit</button>
                      )}
                    </div>
                    <button onClick={() => downloadOperativeNotePDF(caseData, { note_content: note, procedure_name: formData.procedure_name, procedure_date: formData.procedure_date })}
                      className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200" title="Download PDF">
                      <FileText className="w-4 h-4" />
                    </button>
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
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Save to Patient Record (Locked)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            Operative notes are permanent locked entries in the patient's online record.
          </p>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400" />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 resize-none" />
    </div>
  );
}