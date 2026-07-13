import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Check, X, Loader2 } from "lucide-react";

export default function DiagnosisEditor({ caseData, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(caseData.diagnosis || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(caseData.diagnosis || "");
  }, [caseData.diagnosis]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.CaseFile.update(caseData.id, { diagnosis: value.trim() });
      setEditing(false);
      onUpdate();
    } catch {
      alert("Failed to update diagnosis.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(caseData.diagnosis || "");
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          placeholder="Enter diagnosis..."
          className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-indigo-300 text-indigo-900 focus:outline-none focus:border-indigo-500 w-48"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          title="Save"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="p-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50"
          title="Cancel"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
      title="Click to edit diagnosis"
    >
      <span>Dx:</span>
      <span>{caseData.diagnosis || "Add diagnosis"}</span>
    </button>
  );
}