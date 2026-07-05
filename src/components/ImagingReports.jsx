import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { uploadFile } from "@/lib/hiveApi";
import { Camera, Loader2, Image as ImageIcon, FlaskConical, Scan, Plus, FileText } from "lucide-react";

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

  return (
    <div className="space-y-4">
      {/* Upload bar */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4 text-hive-gold" />
          <h3 className="text-sm font-semibold text-foreground">Add Imaging / Report</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={photoType}
            onChange={(e) => setPhotoType(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
          >
            {Object.entries(PHOTO_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
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
            {labResults.map((r, i) => (
              <div key={i} className="bg-background border border-border rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground uppercase">{r.test_type}</p>
                <p className="text-sm font-semibold text-foreground">{r.value} {r.unit}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(r.collected_at).toLocaleDateString("en-IE")}</p>
              </div>
            ))}
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