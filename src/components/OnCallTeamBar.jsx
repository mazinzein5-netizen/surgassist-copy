import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Users, Loader2, Edit3, Check, X, ChevronDown, ChevronUp } from "lucide-react";

export default function OnCallTeamBar({ department, onTeamChange }) {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [draft, setDraft] = useState({ consultant_name: "", registrar_name: "", sho_name: "" });

  const dept = department || user?.department || "general_surgery";

  useEffect(() => {
    loadTeam();
  }, [dept]);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const teams = await base44.entities.OnCallTeam.filter(
        { department: dept, is_active: true },
        "-shift_date",
        1
      );
      if (teams.length > 0) {
        setTeam(teams[0]);
        setDraft({
          consultant_name: teams[0].consultant_name || "",
          registrar_name: teams[0].registrar_name || "",
          sho_name: teams[0].sho_name || "",
        });
        if (onTeamChange) onTeamChange(teams[0]);
      } else {
        setTeam(null);
        setDraft({ consultant_name: "", registrar_name: "", sho_name: "" });
      }
    } catch {
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (team) {
        const updated = await base44.entities.OnCallTeam.update(team.id, {
          consultant_name: draft.consultant_name,
          registrar_name: draft.registrar_name,
          sho_name: draft.sho_name,
        });
        setTeam(updated);
        if (onTeamChange) onTeamChange(updated);
      } else {
        const created = await base44.entities.OnCallTeam.create({
          department: dept,
          hospital: user?.hospital || "",
          consultant_name: draft.consultant_name,
          registrar_name: draft.registrar_name,
          sho_name: draft.sho_name,
          shift_date: new Date().toISOString().split("T")[0],
          is_active: true,
        });
        setTeam(created);
        if (onTeamChange) onTeamChange(created);
      }
      setEditing(false);
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

  const hasTeam = team && (team.consultant_name || team.registrar_name || team.sho_name);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full px-4 py-2.5"
      >
        <Users className="w-4 h-4 text-hive-gold" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide flex-1 text-left">
          On-Call Team — {dept === "general_surgery" ? "General Surgery" : "Orthopaedics"}
        </span>
        {collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-3">
          {editing ? (
            <div className="space-y-2">
              <TeamInput label="Consultant" value={draft.consultant_name} onChange={v => setDraft(p => ({ ...p, consultant_name: v }))} />
              <TeamInput label="Registrar" value={draft.registrar_name} onChange={v => setDraft(p => ({ ...p, registrar_name: v }))} />
              <TeamInput label="SHO" value={draft.sho_name} onChange={v => setDraft(p => ({ ...p, sho_name: v }))} />
              <div className="flex gap-2 pt-1">
                <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-hive-gold text-hive-gold-foreground text-xs font-medium hover:bg-hive-gold/90 disabled:opacity-50">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save Team
                </button>
                <button onClick={() => { setEditing(false); loadTeam(); }} className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs hover:bg-secondary/80">
                  Cancel
                </button>
              </div>
            </div>
          ) : hasTeam ? (
            <div className="space-y-1.5">
              <TeamRow label="Consultant" name={team.consultant_name} />
              <TeamRow label="Registrar" name={team.registrar_name} />
              <TeamRow label="SHO" name={team.sho_name} />
              <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-xs text-hive-gold hover:underline mt-1">
                <Edit3 className="w-3 h-3" /> Edit team
              </button>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground mb-2">No on-call team set for today</p>
              <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-hive-gold text-hive-gold-foreground text-xs font-medium hover:bg-hive-gold/90">
                <Users className="w-3 h-3" /> Set On-Call Team
              </button>
            </div>
          )}
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