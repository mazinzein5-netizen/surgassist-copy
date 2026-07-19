import React, { useState } from "react";
import HandwritingOCR from "@/components/HandwritingOCR";
import { recognizeLabResults } from "@/lib/hiveApi";
import { FlaskConical, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import SelectSheet from "@/components/SelectSheet";

const LAB_TYPES = [
  { value: "haemoglobin", label: "Haemoglobin (Hb)", unit: "g/L", normal: "120-160" },
  { value: "wcc", label: "WCC", unit: "x10⁹/L", normal: "4-11" },
  { value: "platelets", label: "Platelets", unit: "x10⁹/L", normal: "150-400" },
  { value: "sodium", label: "Sodium", unit: "mmol/L", normal: "135-145" },
  { value: "potassium", label: "Potassium", unit: "mmol/L", normal: "3.5-5.0" },
  { value: "urea", label: "Urea", unit: "mmol/L", normal: "2.5-7.0" },
  { value: "creatinine", label: "Creatinine", unit: "µmol/L", normal: "60-120" },
  { value: "crp", label: "CRP", unit: "mg/L", normal: "<5" },
  { value: "egfr", label: "eGFR", unit: "mL/min", normal: ">60" },
  { value: "bilirubin", label: "Bilirubin", unit: "µmol/L", normal: "3-21" },
  { value: "alt", label: "ALT", unit: "IU/L", normal: "10-40" },
  { value: "albumin", label: "Albumin", unit: "g/L", normal: "35-50" },
  { value: "inr", label: "INR", unit: "", normal: "0.8-1.2" },
];

export default function LabResultsCapture({ labResults, onChange }) {
  const [showManual, setShowManual] = useState(false);
  const [manualEntry, setManualEntry] = useState({ test_type: "haemoglobin", value: "", unit: "" });

  const handleOCRResult = (result) => {
    if (result.results && result.results.length > 0) {
      const newResults = [...labResults];
      result.results.forEach((r) => {
        const meta = LAB_TYPES.find(t => t.value === r.test_type);
        newResults.push({
          test_type: r.test_type,
          value: r.value,
          unit: r.unit || meta?.unit || "",
          collected_at: r.collected_at || new Date().toISOString(),
          source: "ocr_ingestion",
        });
      });
      onChange(newResults);
    }
  };

  const addManual = () => {
    if (!manualEntry.value) return;
    const meta = LAB_TYPES.find(t => t.value === manualEntry.test_type);
    onChange([...labResults, {
      test_type: manualEntry.test_type,
      value: parseFloat(manualEntry.value),
      unit: manualEntry.unit || meta?.unit || "",
      collected_at: new Date().toISOString(),
      source: "manual",
    }]);
    setManualEntry({ test_type: "haemoglobin", value: "", unit: "" });
    setShowManual(false);
  };

  const removeResult = (idx) => {
    onChange(labResults.filter((_, i) => i !== idx));
  };

  const isAbnormal = (type, value) => {
    const meta = LAB_TYPES.find(t => t.value === type);
    if (!meta) return false;
    const v = parseFloat(value);
    if (isNaN(v)) return false;
    const ranges = {
      haemoglobin: [120, 160], wcc: [4, 11], platelets: [150, 400],
      sodium: [135, 145], potassium: [3.5, 5.0], urea: [2.5, 7.0],
      creatinine: [60, 120], crp: [0, 5], egfr: [60, 999],
      bilirubin: [3, 21], alt: [10, 40], albumin: [35, 50], inr: [0.8, 1.2],
    };
    const range = ranges[type];
    if (!range) return false;
    return v < range[0] || v > range[1];
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FlaskConical className="w-4 h-4 text-hive-gold" />
        <h4 className="font-semibold text-foreground text-sm">Lab Results</h4>
      </div>

      <HandwritingOCR
        ocrFunction={recognizeLabResults}
        onResult={handleOCRResult}
        label="Scan Lab Results"
        description="Photograph handwritten or printed lab results — AI extracts values automatically"
      />

      {labResults.length > 0 && (
        <div className="bg-background/50 rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-3 py-2 font-medium">Test</th>
                <th className="text-left px-3 py-2 font-medium">Value</th>
                <th className="text-left px-3 py-2 font-medium">Unit</th>
                <th className="text-left px-3 py-2 font-medium">Normal</th>
                <th className="px-2"></th>
              </tr>
            </thead>
            <tbody>
              {labResults.map((r, i) => {
                const meta = LAB_TYPES.find(t => t.value === r.test_type);
                const abnormal = isAbnormal(r.test_type, r.value);
                return (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-3 py-2 text-foreground font-medium">{meta?.label || r.test_type}</td>
                    <td className={`px-3 py-2 font-medium ${abnormal ? "text-destructive" : "text-foreground"}`}>
                      {r.value} {abnormal && <AlertCircle className="w-3 h-3 inline ml-1" />}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{r.unit}</td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">{meta?.normal}</td>
                    <td className="px-2 py-2">
                      <button onClick={() => removeResult(i)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showManual ? (
        <div className="bg-background/50 rounded-lg p-3 border border-border space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <SelectSheet
              value={manualEntry.test_type}
              options={LAB_TYPES.map(t => ({ value: t.value, label: t.label }))}
              onChange={(v) => setManualEntry(p => ({ ...p, test_type: v }))}
              label="Test Type"
            />
            <input
              type="number"
              value={manualEntry.value}
              onChange={e => setManualEntry(p => ({ ...p, value: e.target.value }))}
              placeholder="Value"
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
            />
            <input
              type="text"
              value={manualEntry.unit}
              onChange={e => setManualEntry(p => ({ ...p, unit: e.target.value }))}
              placeholder="Unit"
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={addManual} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-hive-gold text-hive-gold-foreground text-xs font-medium hover:bg-hive-gold/90">
              <Plus className="w-3 h-3" /> Add
            </button>
            <button onClick={() => setShowManual(false)} className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs hover:bg-secondary/80">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowManual(true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80">
          <Plus className="w-3.5 h-3.5" /> Add Lab Result Manually
        </button>
      )}
    </div>
  );
}