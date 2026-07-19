import React, { useState } from "react";
import HandwritingOCR from "@/components/HandwritingOCR";
import { recognizeKardex } from "@/lib/hiveApi";
import { Pill, Plus, Trash2 } from "lucide-react";
import SelectSheet from "@/components/SelectSheet";

export default function KardexCapture({ kardexData, onChange }) {
  const [showManual, setShowManual] = useState(false);
  const [manualEntry, setManualEntry] = useState({ drug: "", dose: "", route: "PO", frequency: "", notes: "" });

  const medications = kardexData?.medications || [];

  const handleOCRResult = (result) => {
    if (result.medications && result.medications.length > 0) {
      const newMeds = [...medications, ...result.medications];
      onChange({ ...kardexData, medications: newMeds });
    }
  };

  const addManual = () => {
    if (!manualEntry.drug || !manualEntry.dose) return;
    onChange({ ...kardexData, medications: [...medications, manualEntry] });
    setManualEntry({ drug: "", dose: "", route: "PO", frequency: "", notes: "" });
    setShowManual(false);
  };

  const removeMed = (idx) => {
    onChange({ ...kardexData, medications: medications.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Pill className="w-4 h-4 text-hive-gold" />
        <h4 className="font-semibold text-foreground text-sm">Medical Kardex</h4>
      </div>

      <HandwritingOCR
        ocrFunction={recognizeKardex}
        onResult={handleOCRResult}
        label="Scan Kardex / Drug Chart"
        description="Photograph the patient's drug kardex — AI extracts medications automatically"
      />

      {medications.length > 0 && (
        <div className="bg-background/50 rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-3 py-2 font-medium">Drug</th>
                <th className="text-left px-3 py-2 font-medium">Dose</th>
                <th className="text-left px-3 py-2 font-medium">Route</th>
                <th className="text-left px-3 py-2 font-medium">Frequency</th>
                <th className="px-2"></th>
              </tr>
            </thead>
            <tbody>
              {medications.map((m, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="px-3 py-2 text-foreground font-medium">{m.drug}</td>
                  <td className="px-3 py-2 text-foreground">{m.dose}</td>
                  <td className="px-3 py-2 text-muted-foreground">{m.route}</td>
                  <td className="px-3 py-2 text-muted-foreground">{m.frequency}</td>
                  <td className="px-2 py-2">
                    <button onClick={() => removeMed(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showManual ? (
        <div className="bg-background/50 rounded-lg p-3 border border-border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={manualEntry.drug}
              onChange={e => setManualEntry(p => ({ ...p, drug: e.target.value }))}
              placeholder="Drug name"
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
            />
            <input
              type="text"
              value={manualEntry.dose}
              onChange={e => setManualEntry(p => ({ ...p, dose: e.target.value }))}
              placeholder="Dose"
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
            />
            <SelectSheet
              value={manualEntry.route}
              options={[{ value: "PO", label: "PO" }, { value: "IV", label: "IV" }, { value: "IM", label: "IM" }, { value: "SC", label: "SC" }, { value: "PR", label: "PR" }, { value: "SL", label: "SL" }, { value: "Topical", label: "Topical" }]}
              onChange={(v) => setManualEntry(p => ({ ...p, route: v }))}
              label="Route"
            />
            <input
              type="text"
              value={manualEntry.frequency}
              onChange={e => setManualEntry(p => ({ ...p, frequency: e.target.value }))}
              placeholder="Frequency (e.g. BD, OD, TDS)"
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
            />
          </div>
          <input
            type="text"
            value={manualEntry.notes}
            onChange={e => setManualEntry(p => ({ ...p, notes: e.target.value }))}
            placeholder="Notes / indication (optional)"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
          />
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
          <Plus className="w-3.5 h-3.5" /> Add Medication Manually
        </button>
      )}
    </div>
  );
}