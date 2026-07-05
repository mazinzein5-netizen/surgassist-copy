import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { suggestInvestigations } from "@/lib/hiveApi";
import AIBadge from "@/components/AIBadge";
import { Loader2, FlaskConical, Scan, Plus, X, Sparkles, Check } from "lucide-react";

const BLOOD_INVESTIGATIONS = [
  "FBC", "UEC", "LFTs", "CRP", "Coagulation / INR", "Group & Save",
  "Amylase", "Lactate", "β-hCG (if female)", "Troponin", "D-dimer",
  "Blood cultures", "VBG / ABG", "Calcium", "Magnesium", "Phosphate",
];

const IMAGING_OPTIONS = [
  "X-ray: AP + Lateral (affected area)", "X-ray: AP Pelvis", "X-ray: Chest",
  "CT Abdomen/Pelvis (with contrast)", "CT Chest", "CT Head", "CTPA",
  "Ultrasound Abdomen", "MRCP", "MRI (specify region)", "Doppler USS",
  "ECG", "Bedside USS (FAST scan)",
];

export default function ReviewInvestigations({ caseData, onUpdate, canEdit }) {
  const invData = caseData.investigation_data || {};
  const [bloods, setBloods] = useState(invData.bloods || []);
  const [imaging, setImaging] = useState(invData.imaging || []);
  const [suggested, setSuggested] = useState({ bloods: [], imaging: [] });
  const [loading, setLoading] = useState(false);
  const [customBlood, setCustomBlood] = useState("");
  const [customImaging, setCustomImaging] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleBlood = async (item) => {
    if (!canEdit) return;
    const next = bloods.includes(item) ? bloods.filter(b => b !== item) : [...bloods, item];
    setBloods(next);
    await persist({ bloods: next, imaging });
  };

  const toggleImaging = async (item) => {
    if (!canEdit) return;
    const next = imaging.includes(item) ? imaging.filter(i => i !== item) : [...imaging, item];
    setImaging(next);
    await persist({ bloods, imaging: next });
  };

  const addCustomBlood = async () => {
    const val = customBlood.trim();
    if (!val || bloods.includes(val)) return;
    const next = [...bloods, val];
    setBloods(next);
    setCustomBlood("");
    await persist({ bloods: next, imaging });
  };

  const addCustomImaging = async () => {
    const val = customImaging.trim();
    if (!val || imaging.includes(val)) return;
    const next = [...imaging, val];
    setImaging(next);
    setCustomImaging("");
    await persist({ bloods, imaging: next });
  };

  const persist = async (data) => {
    setSaving(true);
    try {
      await base44.entities.CaseFile.update(caseData.id, { investigation_data: data });
      onUpdate();
    } catch {
      alert("Failed to save investigations.");
    } finally {
      setSaving(false);
    }
  };

  const handleSuggest = async () => {
    setLoading(true);
    try {
      const result = await suggestInvestigations(caseData);
      setSuggested(result);
    } catch {
      alert("Failed to get AI suggestions.");
    } finally {
      setLoading(false);
    }
  };

  // Merge standard options with AI suggestions for display
  const allBloodOptions = [...new Set([...BLOOD_INVESTIGATIONS, ...suggested.bloods])];
  const allImagingOptions = [...new Set([...IMAGING_OPTIONS, ...suggested.imaging])];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-hive-gold" />
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Investigations</h4>
          {saving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        </div>
        <button
          onClick={handleSuggest}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/30 text-accent text-xs font-semibold hover:bg-accent/20 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          AI Suggest
        </button>
      </div>

      {suggested.bloods.length > 0 || suggested.imaging.length > 0 ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/5 border border-accent/15">
          <AIBadge />
          <p className="text-xs text-accent italic">AI suggestions highlighted below — click to add</p>
        </div>
      ) : null}

      {/* Blood Investigations */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Bloods</p>
        <div className="flex flex-wrap gap-1.5">
          {allBloodOptions.map(item => {
            const selected = bloods.includes(item);
            const isSuggested = suggested.bloods.includes(item);
            return (
              <button
                key={item}
                onClick={() => toggleBlood(item)}
                disabled={!canEdit}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                  selected
                    ? "bg-hive-gold/15 text-hive-gold border-hive-gold/40"
                    : isSuggested
                    ? "bg-accent/10 text-accent border-accent/30 hover:bg-accent/20"
                    : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                } disabled:opacity-50`}
              >
                {selected && <Check className="w-2.5 h-2.5" />}
                {isSuggested && !selected && <Sparkles className="w-2.5 h-2.5" />}
                {item}
              </button>
            );
          })}
        </div>
        {canEdit && (
          <div className="flex items-center gap-1.5 mt-2">
            <input
              type="text"
              value={customBlood}
              onChange={e => setCustomBlood(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustomBlood()}
              placeholder="Add custom blood test..."
              className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
            />
            <button onClick={addCustomBlood} className="p-1.5 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Imaging */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Imaging</p>
        <div className="flex flex-wrap gap-1.5">
          {allImagingOptions.map(item => {
            const selected = imaging.includes(item);
            const isSuggested = suggested.imaging.includes(item);
            return (
              <button
                key={item}
                onClick={() => toggleImaging(item)}
                disabled={!canEdit}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                  selected
                    ? "bg-hive-gold/15 text-hive-gold border-hive-gold/40"
                    : isSuggested
                    ? "bg-accent/10 text-accent border-accent/30 hover:bg-accent/20"
                    : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                } disabled:opacity-50`}
              >
                {selected && <Check className="w-2.5 h-2.5" />}
                {isSuggested && !selected && <Sparkles className="w-2.5 h-2.5" />}
                {item}
              </button>
            );
          })}
        </div>
        {canEdit && (
          <div className="flex items-center gap-1.5 mt-2">
            <input
              type="text"
              value={customImaging}
              onChange={e => setCustomImaging(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustomImaging()}
              placeholder="Add custom imaging..."
              className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
            />
            <button onClick={addCustomImaging} className="p-1.5 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Selected summary */}
      {(bloods.length > 0 || imaging.length > 0) && (
        <div className="bg-background/50 rounded-lg p-3 border border-border/50">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Selected for Note Request</p>
          {bloods.length > 0 && (
            <p className="text-xs text-foreground mb-1">
              <span className="text-muted-foreground">Bloods:</span> {bloods.join(", ")}
            </p>
          )}
          {imaging.length > 0 && (
            <p className="text-xs text-foreground">
              <span className="text-muted-foreground">Imaging:</span> {imaging.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}