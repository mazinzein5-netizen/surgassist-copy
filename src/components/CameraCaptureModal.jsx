import React, { useState, useRef } from "react";
import { Camera, Loader2, X, CheckCircle2, AlertTriangle, ShieldAlert, ShieldCheck, Sparkles, Tag, User } from "lucide-react";
import { uploadFile, classifyClinicalPhoto } from "@/lib/hiveApi";
import AIBadge from "@/components/AIBadge";

const TYPE_LABELS = {
  wound: "Wound Photo",
  xray: "X-Ray / Imaging",
  ecg: "ECG",
  medication_list: "Medication List",
  patient_id: "Patient ID / Wristband",
  other: "Other Clinical Photo",
};

const SEVERITY_STYLES = {
  red: { icon: ShieldAlert, bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive", label: "RED — Immediate Danger" },
  amber: { icon: AlertTriangle, bg: "bg-warning/10", border: "border-warning/30", text: "text-warning", label: "AMBER — Caution" },
  green: { icon: ShieldCheck, bg: "bg-success/10", border: "border-success/30", text: "text-success", label: "GREEN — No Concerns" },
};

export default function CameraCaptureModal({ patientInfo, onCapture, onClose }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [label, setLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const cameraRef = useRef(null);

  const hasPatient = patientInfo?.patient_name?.trim();

  const handleCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFile(file);
      setPhotoUrl(result.file_url);
      setAnalysis(null);
      setConfirmed(false);
    } catch {
      alert("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
      if (cameraRef.current) cameraRef.current.value = "";
    }
  };

  const handleAnalyze = async () => {
    if (!photoUrl || !label.trim()) return;
    setAnalyzing(true);
    try {
      const result = await classifyClinicalPhoto(photoUrl, label.trim(), patientInfo);
      setAnalysis(result);
    } catch {
      alert("Jack couldn't analyze the photo. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (!photoUrl || !label.trim() || !analysis) return;
    onCapture({
      photo_url: photoUrl,
      label: label.trim(),
      detected_type: analysis.detected_type,
      summary: analysis.summary,
      danger_alerts: analysis.danger_alerts || [],
      extracted_data: analysis.extracted_data || "",
    });
    setConfirmed(true);
    setTimeout(() => onClose(), 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="flex flex-col w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-hive-gold" />
            <h3 className="font-semibold text-sm text-foreground">Clinical Photo Capture</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Patient banner */}
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-hive-gold flex-shrink-0" />
          {hasPatient ? (
            <span className="text-xs text-foreground font-medium">
              {patientInfo.patient_name}
              {patientInfo.patient_mrn && <span className="text-muted-foreground ml-1.5">· MRN: {patientInfo.patient_mrn}</span>}
            </span>
          ) : (
            <span className="text-xs text-destructive font-medium">⚠ Enter patient details above before capturing</span>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Step 1: Capture */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Step 1 — Capture Photo</p>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapture} disabled={!hasPatient} />
            {photoUrl ? (
              <div className="relative">
                <img src={photoUrl} alt="captured" className="w-full rounded-lg border border-border max-h-48 object-cover" />
                <button
                  onClick={() => { setPhotoUrl(null); setAnalysis(null); setConfirmed(false); }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => cameraRef.current?.click()}
                disabled={!hasPatient || uploading}
                className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-border hover:border-hive-gold/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {uploading ? <Loader2 className="w-6 h-6 text-hive-gold animate-spin" /> : <Camera className="w-6 h-6 text-muted-foreground" />}
                <span className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Tap to take photo"}</span>
              </button>
            )}
          </div>

          {/* Step 2: Label */}
          {photoUrl && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Step 2 — Label This Photo</p>
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Pre-op wound, Bloods chart, ECG, Meds list"
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={!label.trim() || analyzing}
                className="w-full mt-2.5 px-4 py-2.5 rounded-lg bg-hive-gold/15 text-hive-gold border border-hive-gold/30 font-semibold text-sm hover:bg-hive-gold/25 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {analyzing ? "Jack is analyzing..." : "Analyze with Jack"}
              </button>
            </div>
          )}

          {/* Step 3: Jack's Analysis */}
          {analysis && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step 3 — Jack's Analysis</p>

              {/* Classification */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/40 border border-border">
                <AIBadge />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Classified as</p>
                  <p className="text-sm font-semibold text-foreground">{TYPE_LABELS[analysis.detected_type] || analysis.detected_type}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${analysis.confidence === "high" ? "bg-success/15 text-success" : analysis.confidence === "medium" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>
                  {analysis.confidence} confidence
                </span>
              </div>

              {/* Summary */}
              {analysis.summary && (
                <p className="text-sm text-foreground italic px-3">{analysis.summary}</p>
              )}

              {/* Extracted data */}
              {analysis.extracted_data && analysis.extracted_data !== "N/A" && (
                <div className="px-3 py-2 rounded-lg bg-accent/5 border border-accent/15">
                  <p className="text-xs font-semibold text-accent uppercase mb-1">Extracted Data</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{analysis.extracted_data}</p>
                </div>
              )}

              {/* Danger alerts */}
              {analysis.danger_alerts?.length > 0 && (
                <div className="space-y-1.5">
                  {analysis.danger_alerts.map((alert, i) => {
                    const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.green;
                    const Icon = style.icon;
                    return (
                      <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg ${style.bg} ${style.border} border`}>
                        <Icon className={`w-4 h-4 ${style.text} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold ${style.text}`}>{style.label}</p>
                          <p className="text-sm text-foreground">{alert.alert}</p>
                          {alert.recommendation && <p className="text-xs text-muted-foreground mt-0.5">→ {alert.recommendation}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Confirm button */}
              <button
                onClick={handleConfirm}
                disabled={confirmed}
                className="w-full px-4 py-2.5 rounded-lg bg-hive-gold text-hive-gold-foreground font-semibold text-sm hover:bg-hive-gold/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {confirmed ? <CheckCircle2 className="w-4 h-4" /> : null}
                {confirmed ? "Saved to Patient" : "Confirm & Save to Patient"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}