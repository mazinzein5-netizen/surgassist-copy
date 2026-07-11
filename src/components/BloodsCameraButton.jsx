import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { recognizeLabResults, uploadFile } from "@/lib/hiveApi";
import { Camera, Loader2, Upload } from "lucide-react";

export default function BloodsCameraButton({ caseData, onUpdate, compact = false }) {
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState(null);
  const cameraRef = useRef(null);
  const uploadRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setMessage(null);
    try {
      const uploadResult = await uploadFile(file);
      const ocrResult = await recognizeLabResults(uploadResult.file_url);
      const results = ocrResult.results || [];
      if (results.length === 0) {
        setMessage({ type: "error", text: "No lab results detected. Try a clearer photo or upload manually." });
      } else {
        const labRecords = results.map(r => ({
          case_id: caseData.id,
          patient_name: caseData.patient_name || "",
          patient_mrn: caseData.patient_mrn || "",
          test_type: r.test_type,
          value: r.value,
          unit: r.unit || "",
          collected_at: r.collected_at || new Date().toISOString(),
          source: "ocr_ingestion",
        }));
        await base44.entities.LabResult.bulkCreate(labRecords);
        const names = results.map(r => `${r.test_type}: ${r.value}${r.unit ? " " + r.unit : ""}`).join(", ");
        setMessage({ type: "success", text: `Added ${results.length} result${results.length > 1 ? "s" : ""}: ${names}` });
        onUpdate();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to scan blood results. Please try again." });
    } finally {
      setScanning(false);
      if (cameraRef.current) cameraRef.current.value = "";
      if (uploadRef.current) uploadRef.current.value = "";
    }
  };

  const btnClass = compact
    ? "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors"
    : "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors";

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {scanning && <Loader2 className="w-3.5 h-3.5 animate-spin text-destructive" />}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        <input ref={uploadRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
        <button
          onClick={() => cameraRef.current?.click()}
          disabled={scanning}
          className={btnClass}
        >
          <Camera className="w-3.5 h-3.5" />
          Snap Bloods
        </button>
        <button
          onClick={() => uploadRef.current?.click()}
          disabled={scanning}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload
        </button>
      </div>
      {message && (
        <div className={`mt-2 px-3 py-1.5 rounded-lg text-xs border ${message.type === "success" ? "bg-success/10 border-success/30 text-success" : "bg-destructive/10 border-destructive/30 text-destructive"}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}