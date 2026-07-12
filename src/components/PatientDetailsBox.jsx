import React, { useState, useRef } from "react";
import { User, ChevronDown, ChevronUp, Sparkles, ScanLine, Camera, Upload, Loader2 } from "lucide-react";
import { uploadFile, recognizePatientDemographics } from "@/lib/hiveApi";
import SelectSheet from "@/components/SelectSheet";

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export default function PatientDetailsBox({ value, onChange, autoFilled }) {
  const [open, setOpen] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showScanMenu, setShowScanMenu] = useState(false);
  const cameraRef = useRef(null);
  const fileRef = useRef(null);

  const update = (field, val) => onChange({ ...value, [field]: val });

  const filledCount = ["patient_name", "patient_dob", "patient_mrn", "patient_gender"].filter(
    (f) => value[f]
  ).length;

  const handleScan = async (file) => {
    setShowScanMenu(false);
    setScanning(true);
    try {
      const uploadResult = await uploadFile(file);
      const result = await recognizePatientDemographics(uploadResult.file_url);

      // Only fill empty fields — don't overwrite manual edits
      const merged = { ...value };
      let changed = false;
      const fields = [
        ["patient_name", result.patient_name],
        ["patient_dob", result.patient_dob],
        ["patient_mrn", result.patient_mrn],
        ["patient_gender", result.patient_gender],
      ];
      for (const [key, val] of fields) {
        if (val && !value[key]) {
          merged[key] = val;
          changed = true;
        }
      }
      if (changed) onChange(merged);
    } catch (err) {
      alert("Failed to scan demographics. Please try again or enter manually.");
    } finally {
      setScanning(false);
      if (cameraRef.current) cameraRef.current.value = "";
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleScan(f); }} />
      <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleScan(f); }} />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full text-left"
      >
        <User className="w-4 h-4 text-hive-gold flex-shrink-0" />
        <h3 className="font-semibold text-foreground text-sm flex-1">Patient Details</h3>
        {autoFilled && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-hive-gold bg-hive-gold/10 px-2 py-0.5 rounded-full border border-hive-gold/20">
            <Sparkles className="w-3 h-3" /> Auto-filled
          </span>
        )}
        <span className="text-[10px] text-muted-foreground">{filledCount}/4</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="mt-3">
          {/* Scan Demographics button */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              disabled={scanning}
              onClick={() => setShowScanMenu(v => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/15 text-accent border border-accent/30 text-xs font-medium hover:bg-accent/25 transition-colors disabled:opacity-50"
            >
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />}
              {scanning ? "Scanning..." : "Scan Demographics"}
            </button>
            {showScanMenu && !scanning && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary text-foreground text-xs hover:bg-secondary/80 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" /> Camera
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary text-foreground text-xs hover:bg-secondary/80 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Patient Name</label>
              <input
                type="text"
                value={value.patient_name || ""}
                onChange={(e) => update("patient_name", e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Date of Birth</label>
              <input
                type="date"
                value={value.patient_dob || ""}
                onChange={(e) => update("patient_dob", e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">MRN</label>
              <input
                type="text"
                value={value.patient_mrn || ""}
                onChange={(e) => update("patient_mrn", e.target.value)}
                placeholder="Medical Record Number"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Gender</label>
              <SelectSheet
                value={value.patient_gender || ""}
                options={GENDERS}
                onChange={(v) => update("patient_gender", v)}
                placeholder="Select…"
                label="Gender"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}