import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { uploadFile, classifyAndInterpretImaging } from "@/lib/hiveApi";
import { Camera, Loader2, Image as ImageIcon, FlaskConical, Scan, Plus, FileText, ArrowUp, ArrowDown, Sparkles, AlertTriangle } from "lucide-react";
import AIBadge from "@/components/AIBadge";
import SelectSheet from "@/components/SelectSheet";
import { isOutOfRange, formatRange, LAB_RANGES } from "@/lib/labReferenceRanges";

const PHOTO_TYPE_LABELS = {
  wound: "Wound",
  xray: "X-Ray",
  ecg: "ECG",
  medication_list: "Medication List",
  patient_id: "Patient ID",
  other: "Other",
};

export default function ImagingReports({ caseData, photos, caseId, onPhotoAdded }) {
  const [photoType, setPhotoType] = useState("xray");
  const [caption, setCaption] = useState("");
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [labResults, setLabResults] = useState(null);
  const [loadingLabs, setLoadingLabs] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const scanCameraRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadResult = await uploadFile(file);
      await base44.entities.ClinicalPhoto.create({
        case_id: caseId,
        photo_type: photoType,
        photo_url: uploadResult.file_url,
        caption: caption || "",
      });
      setCaption("");
      onPhotoAdded();
    } catch {
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const loadLabs = async () => {
    setLoadingLabs(true);
    try {
      const data = await base44.entities.LabResult.filter({ case_id: caseId }, "-collected_at", 50);
      setLabResults(data);
    } catch {
      setLabResults([]);
    } finally {
      setLoadingLabs(false);
    }
  };

  useEffect(() => {
    loadLabs();
  }, [caseId]);

  const xrays = photos.filter(p => p.photo_type === "xray");
  const wounds = photos.filter(p => p.photo_type === "wound");
  const others = photos.filter(p => !["xray", "wound"].includes(p.photo_type));

  const handleScanImaging = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setScanResult(null);
    try {
      const uploadResult = await uploadFile(file);
      await base44.entities.ClinicalPhoto.create({
        case_id: caseId,
        photo_type: "xray",
        photo_url: uploadResult.file_url,
        caption: "AI-analyzed imaging",
      });
      const result = await classifyAndInterpretImaging(uploadResult.file_url, caseData);
      setScanResult(result);
      onPhotoAdded();
    } catch {
      setScanResult({ error: "Failed to analyze imaging. Please try again." });
    } finally {
      setScanning(false);
      if (scanCameraRef.current) scanCameraRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Scan & Interpret button */}
      <div className="bg-card border border-hive-gold/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-hive-gold" />
            <h3 className="text-sm font-semibold text-foreground">AI Imaging Analysis</h3>
          </div>
          <input ref={scanCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanImaging} />
          <button
            onClick={() => scanCameraRef.current?.click()}
            disabled={scanning}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-hive-gold/10 border border-hive-gold/30 text-hive-gold text-xs font-semibold hover:bg-hive-gold/20 disabled:opacity-50"
          >
            {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            Scan & Interpret
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Capture an X-ray, CT, MRI, ultrasound, or a radiology report — AI classifies and interprets the image.</p>

        {/* Scan result */}
        {scanning && (
          <div className="mt-3 flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-hive-gold animate-spin" />
            <span className="text-xs text-muted-foreground ml-2">Analyzing imaging...</span>
          </div>
        )}

        {scanResult && !scanResult.error && (
          <div className="mt-3 bg-background border border-border rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <AIBadge />
              <span className="text-xs font-bold text-foreground">{scanResult.image_type?.replace(/_/g, " ") || "Analysis Result"}</span>
              {scanResult.urgency === "critical" && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-500">CRITICAL</span>}
              {scanResult.urgency === "urgent" && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500">URGENT</span>}
            </div>
            {scanResult.modality && <p className="text-xs text-foreground"><span className="text-muted-foreground font-semibold">Modality:</span> {scanResult.modality}</p>}
            {scanResult.body_region && <p className="text-xs text-foreground"><span className="text-muted-foreground font-semibold">Region:</span> {scanResult.body_region}</p>}
            {scanResult.view && <p className="text-xs text-foreground"><span className="text-muted-foreground font-semibold">View:</span> {scanResult.view}</p>}
            {scanResult.findings && <p className="text-xs text-foreground"><span className="text-muted-foreground font-semibold">Findings:</span> {scanResult.findings}</p>}
            {scanResult.impression && <p className="text-xs text-foreground"><span className="text-muted-foreground font-semibold">Impression:</span> {scanResult.impression}</p>}
            {scanResult.danger_alerts && scanResult.danger_alerts !== "None" && (
              <p className="text-xs text-destructive font-medium flex items-start gap-1">
                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span><span className="font-bold">Alerts:</span> {scanResult.danger_alerts}</span>
              </p>
            )}
            {scanResult.summary && <p className="text-xs text-muted-foreground italic mt-1">{scanResult.summary}</p>}
          </div>
        )}

        {scanResult?.error && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
            {scanResult.error}
          </div>
        )}
      </div>

      {/* Upload bar */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4 text-hive-gold" />
          <h3 className="text-sm font-semibold text-foreground">Add Imaging / Report</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <SelectSheet
            value={photoType}
            options={Object.entries(PHOTO_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            onChange={setPhotoType}
            label="Photo Type"
          />
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)..."
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
          />
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-hive-gold text-hive-gold-foreground text-sm font-medium hover:bg-hive-gold/90"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            Upload
          </button>
        </div>
      </div>

      {/* X-Rays */}
      {xrays.length > 0 && (
        <ImageGrid title="X-Rays" icon={Scan} photos={xrays} />
      )}

      {/* Wounds */}
      {wounds.length > 0 && (
        <ImageGrid title="Wound Photos" icon={ImageIcon} photos={wounds} />
      )}

      {/* Other clinical photos */}
      {others.length > 0 && (
        <ImageGrid title="Other Clinical Photos" icon={FileText} photos={others} />
      )}

      {/* Empty state */}
      {photos.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Scan className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No imaging or reports uploaded yet.</p>
        </div>
      )}

      {/* Lab Results Summary */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className="w-4 h-4 text-hive-gold" />
          <h3 className="text-sm font-semibold text-foreground">Lab Results</h3>
          {loadingLabs && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        </div>
        {labResults && labResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {labResults.map((r, i) => {
              const abnormal = isOutOfRange(r.test_type, r.value);
              const arrow = abnormal && r.value < (LAB_RANGES[r.test_type]?.min) ? "down" : "up";
              return (
                <div key={i} className={`bg-background border rounded-lg px-3 py-2 ${abnormal ? "border-red-500/50 bg-red-500/5" : "border-border"}`}>
                  <p className="text-xs text-muted-foreground uppercase">{r.test_type}</p>
                  <div className="flex items-center gap-1">
                    <p className={`text-sm font-semibold ${abnormal ? "text-red-500" : "text-foreground"}`}>{r.value} {r.unit}</p>
                    {abnormal && (
                      <span className="text-red-500">
                        {arrow === "up" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{formatRange(r.test_type) || "—"}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(r.collected_at).toLocaleDateString("en-IE")}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No lab results recorded for this patient.</p>
        )}
      </div>
    </div>
  );
}

function ImageGrid({ title, icon: Icon, photos }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-hive-gold" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">({photos.length})</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map(p => (
          <div key={p.id} className="relative group">
            <img src={p.photo_url} alt={p.photo_type} className="w-full h-32 rounded-lg object-cover border border-border" />
            {p.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm rounded-b-lg px-2 py-1">
                <span className="text-[10px] text-white truncate block">{p.caption}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}