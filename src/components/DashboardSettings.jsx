import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Building2, Stethoscope, ShieldPlus, Loader2, Save, Check, Radio, ChevronDown, ClipboardList } from "lucide-react";

const DEPT_OPTIONS = [
  { value: "orthopaedics", label: "Orthopaedics" },
  { value: "general_surgery", label: "General Surgery" },
  { value: "ent", label: "ENT" },
];

export default function DashboardSettings() {
  const { user, checkUserAuth } = useAuth();
  const [hospital, setHospital] = useState(user?.hospital || "");
  const [department, setDepartment] = useState(user?.department || "orthopaedics");
  const [crossCover, setCrossCover] = useState(user?.cross_cover_departments || []);
  const [onCallMode, setOnCallMode] = useState(user?.on_call_mode || false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  const summaryParts = [];
  if (hospital) summaryParts.push(hospital);
  summaryParts.push(DEPT_OPTIONS.find(d => d.value === department)?.label || department);
  if (crossCover.length > 0) summaryParts.push(`+${crossCover.length} cross-cover`);
  const summary = summaryParts.join(" · ");

  const toggleCrossCover = (dept) => {
    setCrossCover(prev => {
      if (prev.includes(dept)) return prev.filter(d => d !== dept);
      if (prev.length >= 2) return prev;
      return [...prev, dept];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        hospital,
        department,
        cross_cover_departments: crossCover,
        on_call_mode: onCallMode,
      });
      await checkUserAuth();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOnCall = async () => {
    const newValue = !onCallMode;
    setOnCallMode(newValue);
    setSaving(true);
    try {
      await base44.auth.updateMe({ on_call_mode: newValue });
      await checkUserAuth();
    } catch {
      setOnCallMode(!newValue);
      alert("Failed to toggle on-call mode.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50";
  const labelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wider";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-5 py-4 text-left hover:bg-muted/50 transition-colors"
      >
        <ClipboardList className="w-4 h-4 text-hive-gold flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground text-sm">Shift & Department Settings</h3>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{summary}</p>
        </div>
        {onCallMode && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-bold">
            <Radio className="w-2.5 h-2.5" /> ON-CALL
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-5">
          {/* Hospital + Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`${labelClass} flex items-center gap-1.5 mb-1.5`}>
                <Building2 className="w-3.5 h-3.5" /> Hospital
              </label>
              <input value={hospital} onChange={e => setHospital(e.target.value)}
                placeholder="e.g. St. Vincent's University Hospital"
                className={inputClass} />
            </div>
            <div>
              <label className={`${labelClass} flex items-center gap-1.5 mb-1.5`}>
                <Stethoscope className="w-3.5 h-3.5" /> Primary Department
              </label>
              <select value={department} onChange={e => setDepartment(e.target.value)} className={inputClass}>
                {DEPT_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>

          {/* Cross Cover */}
          <div>
            <label className={`${labelClass} flex items-center gap-1.5 mb-1.5`}>
              <ShieldPlus className="w-3.5 h-3.5" /> Cross-Cover Departments
              <span className="text-muted-foreground/60 font-normal normal-case tracking-normal">({crossCover.length}/2)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DEPT_OPTIONS.map(d => {
                const selected = crossCover.includes(d.value);
                const disabled = !selected && crossCover.length >= 2;
                const isPrimary = d.value === department;
                return (
                  <button key={d.value} type="button"
                    onClick={() => !isPrimary && toggleCrossCover(d.value)}
                    disabled={isPrimary || disabled}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      isPrimary
                        ? "border-muted text-muted-foreground/40 cursor-not-allowed"
                        : selected
                        ? "bg-hive-gold/15 border-hive-gold/40 text-hive-gold"
                        : disabled
                        ? "border-border text-muted-foreground/30 cursor-not-allowed"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-hive-gold/30"
                    }`}>
                    {d.label}{isPrimary ? " (primary)" : ""}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground/70 mt-1.5">Select up to 2 additional departments you cover on-call.</p>
          </div>

          {/* On-Call Mode + Save */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
            <button onClick={handleToggleOnCall} disabled={saving}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
                onCallMode
                  ? "bg-red-500/15 border border-red-500/40 text-red-400 animate-pulse-gold"
                  : "bg-muted border border-border text-muted-foreground hover:text-foreground"
              }`}>
              <Radio className={`w-4 h-4 ${onCallMode ? "animate-pulse" : ""}`} />
              {onCallMode ? "On-Call Mode Active" : "Start On-Call Mode"}
            </button>

            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-hive-gold text-hive-navy text-sm font-semibold hover:bg-hive-gold/90 transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? "Saved" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}