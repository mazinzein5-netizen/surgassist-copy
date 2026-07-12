import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import HiveLogo from "@/components/HiveLogo";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import { Loader2, Save, Stethoscope, Building2, BadgeCheck, AlertTriangle, Trash2 } from "lucide-react";

const GRADE_LABELS = { nchd: "NCHD", registrar: "Registrar", consultant: "Consultant" };
const DEPT_LABELS = { orthopaedics: "Orthopaedics", general_surgery: "General Surgery" };

export default function Profile() {
  const { user, checkUserAuth } = useAuth();
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    imc_number: user?.imc_number || "",
    clinical_grade: user?.clinical_grade || "nchd",
    hospital: user?.hospital || "",
    department: user?.department || "orthopaedics",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        imc_number: form.imc_number,
        clinical_grade: form.clinical_grade,
        hospital: form.hospital,
        department: form.department,
      });
      await checkUserAuth();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your professional details</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 hex-clip bg-hive-gold/20 flex items-center justify-center">
            <span className="text-hive-gold font-bold text-xl">{user?.full_name?.charAt(0)?.toUpperCase() || "U"}</span>
          </div>
          <div>
            <h2 className="font-bold text-foreground">{user?.full_name || "User"}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-hive-gold mt-0.5">{GRADE_LABELS[user?.clinical_grade] || "NCHD"}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1"><Stethoscope className="w-3 h-3" /> Full Name</label>
            <input value={form.full_name} onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))} disabled className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground mt-1">Name is managed by your account settings.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1"><BadgeCheck className="w-3 h-3" /> IMC Number</label>
            <input value={form.imc_number} onChange={(e) => setForm(p => ({ ...p, imc_number: e.target.value }))} placeholder="e.g. 123456" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Grade</label>
            <select value={form.clinical_grade} onChange={(e) => setForm(p => ({ ...p, clinical_grade: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50">
              <option value="nchd">NCHD</option>
              <option value="registrar">Registrar</option>
              <option value="consultant">Consultant</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1"><Building2 className="w-3 h-3" /> Hospital</label>
            <input value={form.hospital} onChange={(e) => setForm(p => ({ ...p, hospital: e.target.value }))} placeholder="e.g. St. Vincent's University Hospital" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Department</label>
            <select value={form.department} onChange={(e) => setForm(p => ({ ...p, department: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50">
              <option value="orthopaedics">Orthopaedics</option>
              <option value="general_surgery">General Surgery</option>
            </select>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="w-full mt-5 px-4 py-2.5 rounded-lg bg-hive-gold text-hive-gold-foreground font-medium text-sm hover:bg-hive-gold/90 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Delete Account */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
        <h2 className="font-bold text-destructive text-sm flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4" /> Delete Account
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Permanently remove your account and profile data. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/30 text-sm font-medium hover:bg-destructive/20 transition-colors min-h-[44px]"
        >
          <Trash2 className="w-4 h-4" /> Delete My Account
        </button>
      </div>

      <div className="text-center">
        <HiveLogo size={32} showText />
        <p className="text-[10px] text-muted-foreground mt-3">AI Decision Support — Verify All Output Clinically</p>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} />
      )}
    </div>
  );
}