import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { generateAdmissionNote, recognizeLabResults, recognizeGpLetter, classifyAndInterpretImaging, uploadFile } from "@/lib/hiveApi";
import { compileProformaLines } from "@/components/OrthoProforma";
import { Loader2, FileText, X, Save, RefreshCw, Lock, FlaskConical, Scan, Camera, Download, Share2, Stethoscope } from "lucide-react";
import AIBadge from "@/components/AIBadge";
import FormattedAdmissionNote from "@/components/FormattedAdmissionNote";
import ClinicalExamFindings from "@/components/ClinicalExamFindings";
import { exportAdmissionNotePDF, downloadAdmissionNotePDF } from "@/lib/pdfExport";

export default function AdmissionNotePanel({ caseData, caseId, onClose, onUpdate }) {
  const { user } = useAuth();
  const [selectedBloods, setSelectedBloods] = useState([]);
  const [selectedImaging, setSelectedImaging] = useState([]);
  const [comorbidities, setComorbidities] = useState("");
  const [examFindings, setExamFindings] = useState([]);
  const [note, setNote] = useState(caseData.admission_note || "");
  const [editing, setEditing] = useState(false);
  const [editedNote, setEditedNote] = useState(note);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanningBloods, setScanningBloods] = useState(false);
  const [scanningGp, setScanningGp] = useState(false);
  const [scanningImaging, setScanningImaging] = useState(false);
  const [scanMessage, setScanMessage] = useState(null);
  const [imagingResult, setImagingResult] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const bloodsCameraRef = useRef(null);
  const gpCameraRef = useRef(null);
  const imagingCameraRef = useRef(null);

  useEffect(() => {
    const invData = caseData.investigation_data || {};
    if (Array.isArray(invData.bloods) && invData.bloods.length > 0) setSelectedBloods(invData.bloods);
    if (Array.isArray(invData.imaging) && invData.imaging.length > 0) setSelectedImaging(invData.imaging);
  }, [caseData.id]);

  const toggleBlood = (item) => setSelectedBloods(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  const toggleImaging = (item) => setSelectedImaging(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);

  // Camera: Scan Bloods
  const handleBloodsCamera = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanningBloods(true);
    setScanMessage(null);
    try {
      const uploadResult = await uploadFile(file);
      const ocrResult = await recognizeLabResults(uploadResult.file_url);
      const results = ocrResult.results || [];
      if (results.length === 0) {
        setScanMessage({ type: "error", text: "No lab results detected in the image." });
      } else {
        const labRecords = results.map(r => ({
          case_id: caseId, patient_name: caseData.patient_name || "", patient_mrn: caseData.patient_mrn || "",
          test_type: r.test_type, value: r.value, unit: r.unit || "",
          collected_at: r.collected_at || new Date().toISOString(), source: "ocr_ingestion",
        }));
        await base44.entities.LabResult.bulkCreate(labRecords);
        const names = results.map(r => `${r.test_type}: ${r.value}${r.unit ? " " + r.unit : ""}`).join(", ");
        setScanMessage({ type: "success", text: `Added ${results.length} lab result(s): ${names}` });
        onUpdate();
      }
    } catch { setScanMessage({ type: "error", text: "Failed to scan blood results." }); }
    finally {
      setScanningBloods(false);
      if (bloodsCameraRef.current) bloodsCameraRef.current.value = "";
    }
  };

  // Camera: Scan GP Letter for comorbidities & medications
  const handleGpCamera = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanningGp(true);
    setScanMessage(null);
    try {
      const uploadResult = await uploadFile(file);
      const result = await recognizeGpLetter(uploadResult.file_url);
      const parts = [];
      if (result.comorbidities) parts.push(result.comorbidities);
      if (result.medications) parts.push(`Medications: ${result.medications}`);
      if (result.allergies && result.allergies !== "NKDA") parts.push(`Allergies: ${result.allergies}`);
      if (result.other_info) parts.push(result.other_info);
      const compiled = parts.join("\n");
      setComorbidities(prev => prev ? `${prev}\n${compiled}` : compiled);
      setScanMessage({ type: "success", text: "GP letter scanned — comorbidities and medications extracted." });
    } catch { setScanMessage({ type: "error", text: "Failed to scan GP letter." }); }
    finally {
      setScanningGp(false);
      if (gpCameraRef.current) gpCameraRef.current.value = "";
    }
  };

  // Camera: Scan & Interpret Imaging
  const handleImagingCamera = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanningImaging(true);
    setImagingResult(null);
    try {
      const uploadResult = await uploadFile(file);
      await base44.entities.ClinicalPhoto.create({
        case_id: caseId, photo_type: "xray", photo_url: uploadResult.file_url, caption: "AI-interpreted imaging",
      });
      const result = await classifyAndInterpretImaging(uploadResult.file_url, caseData);
      setImagingResult(result);
      onUpdate();
    } catch { setScanMessage({ type: "error", text: "Failed to analyze imaging." }); }
    finally {
      setScanningImaging(false);
      if (imagingCameraRef.current) imagingCameraRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateAdmissionNote(caseData, selectedBloods, selectedImaging, comorbidities, examFindings);
      const generated = typeof result === "string" ? result : (result.admission_note || "");
      setNote(generated);
      setEditedNote(generated);
      await base44.entities.CaseFile.update(caseId, {
        admission_note: generated,
        investigation_data: { bloods: selectedBloods, imaging: selectedImaging },
      });
      onUpdate();
    } catch { alert("Failed to generate admission note."); }
    finally { setGenerating(false); }
  };

  const handleSaveToRecord = async () => {
    const finalNote = editing ? editedNote : note;
    if (!finalNote) return;
    setSaving(true);
    try {
      await base44.entities.CaseFile.update(caseId, {
        admission_note: finalNote,
        investigation_data: { bloods: selectedBloods, imaging: selectedImaging },
        status: ["referral_intake", "triage", "accepted"].includes(caseData.status) ? "admitted" : caseData.status,
        admission_date: caseData.admission_date || new Date().toISOString(),
        note_author_name: user?.full_name || "Unknown",
        note_author_grade: user?.clinical_grade || "nchd",
        note_author_imc: user?.imc_number || "",
        note_locked_at: new Date().toISOString(),
      });
      await base44.entities.CaseNote.create({
        case_id: caseId, patient_id: caseData.patient_id || "",
        note_type: "admission", content: finalNote,
        author_name: user?.full_name || "Unknown", author_id: user?.id || "",
        author_grade: user?.clinical_grade || "nchd", author_imc: user?.imc_number || "",
        is_locked: true,
      });
      setNote(finalNote);
      setEditing(false);
      onUpdate();
      onClose();
    } catch { alert("Failed to save admission note to patient record."); }
    finally { setSaving(false); }
  };

  const handleSaveEdit = () => { setNote(editedNote); setEditing(false); };

  const handleShare = async () => {
    setShowShareMenu(false);
    const patientName = caseData.patient_name || "Unknown";
    const summary = `HIVE SURGICAL ASSISTANT — ADMISSION NOTE\nPatient: ${patientName}\nMRN: ${caseData.patient_mrn || "—"}\nDOB: ${caseData.patient_dob ? new Date(caseData.patient_dob).toLocaleDateString("en-IE") : "—"}\n\n${note}`;

    if (navigator.share) {
      try {
        const doc = exportAdmissionNotePDF(caseData, note);
        const pdfBlob = doc.output("blob");
        const file = new File([pdfBlob], `AdmissionNote_${patientName.replace(/\s/g, "_")}.pdf`, { type: "application/pdf" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `Admission Note — ${patientName}`, text: summary });
        } else {
          await navigator.share({ title: `Admission Note — ${patientName}`, text: summary });
        }
      } catch (err) {
        if (err.name !== "AbortError") downloadAdmissionNotePDF(caseData, note);
      }
    } else {
      downloadAdmissionNotePDF(caseData, note);
    }
  };

  const SectionHeader = ({ icon: Icon, title, cameraRef, onCamera, scanning, cameraLabel }) => (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-500" />
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      {cameraRef && (
        <>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onCamera} />
          <button onClick={() => cameraRef.current?.click()} disabled={scanning}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-[11px] font-semibold hover:bg-gray-200 disabled:opacity-50">
            {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
            {cameraLabel}
          </button>
        </>
      )}
    </div>
  );

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
          <div className="flex items-center gap-2">
            {note && (
              <div className="relative">
                <button onClick={() => setShowShareMenu(!showShareMenu)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800">
                  <Share2 className="w-3.5 h-3.5" /> Export
                </button>
                {showShareMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20 w-48">
                      <button onClick={() => { setShowShareMenu(false); downloadAdmissionNotePDF(caseData, note); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-700 hover:bg-gray-100 text-left">
                        <Download className="w-3.5 h-3.5" /> Download PDF
                      </button>
                      <button onClick={handleShare}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-700 hover:bg-gray-100 text-left border-t border-gray-100">
                        <Share2 className="w-3.5 h-3.5" /> Share (Device)
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {scanMessage && (
            <div className={`px-3 py-2 rounded-lg text-xs border ${scanMessage.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
              {scanMessage.text}
            </div>
          )}

          {/* Blood Investigations with camera */}
          <div>
            <SectionHeader icon={FlaskConical} title="Blood Investigations" cameraRef={bloodsCameraRef} onCamera={handleBloodsCamera} scanning={scanningBloods} cameraLabel="Scan Bloods" />
            <div className="flex flex-wrap gap-1.5">
              {["FBC", "UEC", "LFTs", "CRP", "Coagulation / INR", "Group & Save", "Amylase", "Lactate", "β-hCG", "Troponin", "D-dimer", "Blood cultures", "VBG / ABG", "Calcium", "Magnesium", "Phosphate"].map(item => (
                <button key={item} onClick={() => toggleBlood(item)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    selectedBloods.includes(item) ? "bg-gray-900 text-white border-gray-900" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Imaging with camera */}
          <div>
            <SectionHeader icon={Scan} title="Imaging & Investigations" cameraRef={imagingCameraRef} onCamera={handleImagingCamera} scanning={scanningImaging} cameraLabel="Scan & Interpret" />
            <div className="flex flex-wrap gap-1.5">
              {["X-ray: AP + Lateral", "X-ray: AP Pelvis", "X-ray: Chest", "CT Abdomen/Pelvis", "CT Chest", "CT Head", "CTPA", "Ultrasound Abdomen", "MRCP", "MRI", "Doppler USS", "ECG", "FAST scan"].map(item => (
                <button key={item} onClick={() => toggleImaging(item)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    selectedImaging.includes(item) ? "bg-gray-900 text-white border-gray-900" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}>
                  {item}
                </button>
              ))}
            </div>
            {/* AI Imaging Interpretation Result */}
            {imagingResult && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AIBadge />
                  <span className="text-xs font-bold text-gray-900">AI Imaging Analysis</span>
                  {imagingResult.urgency === "critical" && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">CRITICAL</span>}
                  {imagingResult.urgency === "urgent" && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">URGENT</span>}
                </div>
                <div className="space-y-1 text-xs text-gray-700">
                  <p><span className="font-semibold">Type:</span> {imagingResult.image_type?.replace(/_/g, " ")}</p>
                  {imagingResult.modality && <p><span className="font-semibold">Modality:</span> {imagingResult.modality}</p>}
                  {imagingResult.body_region && <p><span className="font-semibold">Region:</span> {imagingResult.body_region}</p>}
                  {imagingResult.findings && <p><span className="font-semibold">Findings:</span> {imagingResult.findings}</p>}
                  {imagingResult.impression && <p><span className="font-semibold">Impression:</span> {imagingResult.impression}</p>}
                  {imagingResult.danger_alerts && imagingResult.danger_alerts !== "None" && (
                    <p className="text-red-600 font-medium"><span className="font-bold">⚠ Alerts:</span> {imagingResult.danger_alerts}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Comorbidities with camera */}
          <div>
            <SectionHeader icon={Stethoscope} title="Comorbidities & Medications" cameraRef={gpCameraRef} onCamera={handleGpCamera} scanning={scanningGp} cameraLabel="Scan GP Letter" />
            <textarea value={comorbidities} onChange={(e) => setComorbidities(e.target.value)} rows={3}
              placeholder="e.g. T2DM, HTN, AF on warfarin, CKD stage 3&#10;Medications: Apixaban 5mg BD, Metformin 1g BD&#10;Or scan a GP letter to auto-extract..."
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 resize-none" />
          </div>

          {/* Clinical Examination Findings */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Clinical Examination Findings</h3>
            </div>
            <ClinicalExamFindings selected={examFindings} onToggle={setExamFindings} department={caseData.department} />
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