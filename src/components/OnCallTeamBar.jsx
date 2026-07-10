import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Users, Loader2, Edit3, Check, ChevronDown, ChevronUp } from "lucide-react";

const ALL_DEPTS = [
  { value: "general_surgery", label: "General Surgery" },
  { value: "orthopaedics", label: "Orthopaedics" },
  { value: "ent", label: "ENT" },
];

const DEPT_LABELS = {
  general_surgery: "General Surgery",
  orthopaedics: "Orthopaedics",
  ent: "ENT",
};

const CATCHMENT_HOSPITALS = [
  { value: "portlaoise_ed", label: "Portlaoise ED" },
  { value: "mullingar_ed", label: "Mullingar ED" },
  { value: "ballina_ed", label: "Ballina ED" },
];

export default function OnCallTeamBar({ department, onTeamChange, onReferringHospitalChange }) {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [selectedDepts, setSelectedDepts] = useState([department || user?.department || "general_surgery"]);
  const [referringHospital, setReferringHospital] = useState(null);
  const [editingDept, setEditingDept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [draft, setDraft] = useState({ consultant_name: "", registrar_name: "", sho_name: "" });

  useEffect(() => {
    loadTeams();
  }, [selectedDepts]);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const allTeams = await base44.entities.OnCallTeam.filter(
        { is_active: true },
        "-shift_date",
        50
      );
      const filtered = allTeams.filter(t => selectedDepts.includes(t.department));
      setTeams(filtered);
      if (onTeamChange && filtered.length > 0) onTeamChange(filtered);
    } catch {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleDept = (deptValue) => {
    setSelectedDepts(prev => {
      if (prev.includes(deptValue)) {
        return prev.length > 1 ? prev.filter(d => d !== deptValue) : prev;
      }
      return [...prev, deptValue];
    });
  };

  const toggleHospital = (hospValue) => {
    setReferringHospital(prev => {
      const next = prev === hospValue ? null : hospValue;
      if (onReferringHospitalChange) onReferringHospitalChange(next);
      return next;
    });
  };

  const startEdit = (dept) => {
    const existing = teams.find(t => t.department === dept);
    setDraft({
      consultant_name: existing?.consultant_name || "",
      registrar_name: existing?.registrar_name || "",
      sho_name: existing?.sho_name || "",
    });
    setEditingDept(dept);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const existing = teams.find(t => t.department === editingDept);
      if (existing) {
        const updated = await base44.entities.OnCallTeam.update(existing.id, {
          consultant_name: draft.consultant_name,
          registrar_name: draft.registrar_name,
          sho_name: draft.sho_name,
        });
        setTeams(prev => prev.map(t => t.id === updated.id ? updated : t));
      } else {
        const created = await base44.entities.OnCallTeam.create({
          department: editingDept,
          hospital: user?.hospital || "",
          consultant_name: draft.consultant_name,
          registrar_name: draft.registrar_name,
          sho_name: draft.sho_name,
          shift_date: new Date().toISOString().split("T")[0],
          is_active: true,
        });
        setTeams(prev => [...prev, created]);
      }
      if (onTeamChange) onTeamChange(teams);
      setEditingDept(null);
    } catch {
      alert("Failed to save on-call team.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading on-call team...
      </div>
    );
  }

  const selectedLabels = selectedDepts.map(d => DEPT_LABELS[d] || d).join(" + ");

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full px-4 py-2.5"
      >
        <Users className="w-4 h-4 text-hive-gold" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide flex-1 text-left">
          On-Call — {selectedLabels}
        </span>
        {collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-3">
          {/* Department cross-cover selector */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {ALL_DEPTS.map(d => (
              <button
                key={d.value}
                onClick={() => toggleDept(d.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedDepts.includes(d.value)
                    ? "bg-hive-gold/15 text-hive-gold border border-hive-gold/30"
                    : "bg-secondary text-muted-foreground border border-border hover:text-foreground"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* External catchment hospital selector (referring EDs) */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Referring Catchment Hospital
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CATCHMENT_HOSPITALS.map(h => (
                <button
                  key={h.value}
                  onClick={() => toggleHospital(h.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    referringHospital === h.value
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "bg-secondary text-muted-foreground border border-border hover:text-foreground"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Teams for all selected departments */}
          {selectedDepts.map(dept => {
            const team = teams.find(t => t.department === dept);
            const hasTeam = team && (team.consultant_name || team.registrar_name || team.sho_name);
            return (
              <div key={dept} className="border-t border-border first:border-t-0 pt-2 first:pt-0">
                <p className="text-[10px] font-bold text-hive-gold uppercase tracking-wider mb-1.5">
                  {DEPT_LABELS[dept] || dept}
                </p>
                {editingDept === dept ? (
                  <div className="space-y-2">
                    <TeamInput label="Consultant" value={draft.consultant_name} onChange={v => setDraft(p => ({ ...p, consultant_name: v }))} />
                    <TeamInput label="Registrar" value={draft.registrar_name} onChange={v => setDraft(p => ({ ...p, registrar_name: v }))} />
                    <TeamInput label="SHO" value={draft.sho_name} onChange={v => setDraft(p => ({ ...p, sho_name: v }))} />
                    <div className="flex gap-2 pt-1">
                      <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-hive-gold text-hive-gold-foreground text-xs font-medium hover:bg-hive-gold/90 disabled:opacity-50">
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                      </button>
                      <button onClick={() => setEditingDept(null)} className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs hover:bg-secondary/80">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : hasTeam ? (
                  <div className="space-y-1.5">
                    <TeamRow label="Consultant" name={team.consultant_name} />
                    <TeamRow label="Registrar" name={team.registrar_name} />
                    <TeamRow label="SHO" name={team.sho_name} />
                    <button onClick={() => startEdit(dept)} className="inline-flex items-center gap-1 text-xs text-hive-gold hover:underline mt-1">
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-1.5">
                    <p className="text-xs text-muted-foreground mb-1.5">No team set</p>
                    <button onClick={() => startEdit(dept)} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-hive-gold/80 text-hive-gold-foreground text-xs font-medium hover:bg-hive-gold/90">
                      <Users className="w-3 h-3" /> Set Team
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TeamRow({ label, name }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium text-muted-foreground w-20">{label}</span>
      <span className="text-sm text-foreground">{name || "—"}</span>
    </div>
  );
}

function TeamInput({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[11px] font-medium text-muted-foreground w-20">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={`Enter ${label} name`}
        className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
      />
    </div>
  );
}