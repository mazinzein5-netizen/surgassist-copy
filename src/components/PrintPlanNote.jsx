import React, { useState } from "react";
import { Printer, FileText, X, Phone, Download, Send, Loader2, Plus, XCircle, Sparkles, Save, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { downloadCallNotePDF } from "@/lib/pdfExport";
import { suggestInvestigations } from "@/lib/hiveApi";
import ReasoningBullets from "@/components/ReasoningBullets";
import ShareCallNote from "@/components/ShareCallNote";

export default function PrintPlanNote({ caseData, onClose, onUpdate }) {
  const [reasoning, setReasoning] = useState(caseData.triage_reasoning || "");
  const [plan, setPlan] = useState(caseData.treatment_plan || "");
  const invData = caseData.investigation_data || {};
  const [bloods, setBloods] = useState(Array.isArray(invData.bloods) ? invData.bloods : []);
  const [imaging, setImaging] = useState(Array.isArray(invData.imaging) ? invData.imaging : []);
  const [newBlood, setNewBlood] = useState("");
  const [newImaging, setNewImaging] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [dirty, setDirty] = useState(false);

  const markDirty = () => setDirty(true);

  const mergedData = {
    ...caseData,
    triage_reasoning: reasoning,
    treatment_plan: plan,
    investigation_data: { bloods, imaging },
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.CaseFile.update(caseData.id, {
        triage_reasoning: reasoning,
        treatment_plan: plan,
        investigation_data: { bloods, imaging },
      });
      setDirty(false);
      if (onUpdate) onUpdate();
    } catch {
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleAISuggest = async () => {
    setSuggesting(true);
    try {
      const result = await suggestInvestigations(mergedData);
      if (result.bloods) setBloods(prev => [...new Set([...prev, ...result.bloods])]);
      if (result.imaging) setImaging(prev => [...new Set([...prev, ...result.imaging])]);
      markDirty();
    } catch {
      alert("Failed to get AI suggestions.");
    } finally {
      setSuggesting(false);
    }
  };

  const addBlood = () => {
    if (!newBlood.trim()) return;
    setBloods(prev => [...prev, newBlood.trim()]);
    setNewBlood("");
    markDirty();
  };
  const removeBlood = (idx) => { setBloods(prev => prev.filter((_, i) => i !== idx)); markDirty(); };

  const addImaging = () => {
    if (!newImaging.trim()) return;
    setImaging(prev => [...prev, newImaging.trim()]);
    setNewImaging("");
    markDirty();
  };
  const removeImaging = (idx) => { setImaging(prev => prev.filter((_, i) => i !== idx)); markDirty(); };

  const handlePrint = () => downloadCallNotePDF(mergedData);
  const handleDownloadPDF = () => downloadCallNotePDF(mergedData);

  const handleEmail = async () => {
    const email = prompt("Enter email address to send the call note to:");
    if (!email) return;
    setEmailing(true);
    try {
      const body = buildEmailBody(mergedData);
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `HIVE Call Note — ${caseData.patient_name || "Unknown"}${caseData.patient_mrn ? ` (MRN: ${caseData.patient_mrn})` : ""}`,
        body,
      });
      alert("Call note emailed successfully.");
    } catch {
      alert("Failed to send email.");
    } finally {
      setEmailing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto print:static print:bg-white print:overflow-visible">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-hive-gold" />
          <h2 className="text-sm font-semibold text-foreground">After Hours Call Note</h2>
          {dirty && <span className="text-xs text-warning">• unsaved</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving || !dirty} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/15 text-success text-xs font-medium hover:bg-success/25 disabled:opacity-40">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </button>
          <button onClick={handleDownloadPDF} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <ShareCallNote caseData={mergedData} patientName={caseData.patient_name} />
          <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hive-gold text-hive-gold-foreground text-xs font-medium hover:bg-hive-gold/90">
            <Printer className="w-3.5 h-3.5" /> Print PDF
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto">
        {/* LEFT: Editor panel */}
        <div className="lg:w-[42%] lg:min-w-[380px] border-r border-border p-4 space-y-4 bg-card/30 print:hidden">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <ChevronRight className="w-3 h-3" /> Edit Note Sections
          </p>

          {/* Section 1: Reasoning */}
          <EditSection title="Reasoning" icon="brain">
            <textarea
              value={reasoning}
              onChange={e => { setReasoning(e.target.value); markDirty(); }}
              rows={6}
              placeholder="Clinical impression and reasoning..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50 resize-y"
            />
          </EditSection>

          {/* Section 2: Plan */}
          <EditSection title="Plan" icon="clipboard">
            <textarea
              value={plan}
              onChange={e => { setPlan(e.target.value); markDirty(); }}
              rows={6}
              placeholder="Management plan..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50 resize-y"
            />
          </EditSection>

          {/* Section 3: Investigations */}
          <EditSection title="Investigations" icon="flask">
            <button
              onClick={handleAISuggest}
              disabled={suggesting}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-hive-gold/10 border border-hive-gold/30 text-hive-gold text-xs font-semibold hover:bg-hive-gold/20 transition-colors disabled:opacity-50 mb-3"
            >
              {suggesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {suggesting ? "AI suggesting..." : "AI Suggest Investigations"}
            </button>

            {/* Bloods */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-accent uppercase mb-1.5">Bloods</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {bloods.length === 0 && <p className="text-xs text-muted-foreground italic">No bloods added</p>}
                {bloods.map((b, i) => (
                  <span key={i} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-md bg-accent/10 border border-accent/25 text-xs text-accent">
                    {b}
                    <button onClick={() => removeBlood(i)} className="p-0.5 rounded hover:bg-accent/20">
                      <XCircle className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newBlood}
                  onChange={e => setNewBlood(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addBlood()}
                  placeholder="Add blood test..."
                  className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
                />
                <button onClick={addBlood} className="p-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Imaging */}
            <div>
              <p className="text-xs font-semibold text-accent uppercase mb-1.5">Imaging</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {imaging.length === 0 && <p className="text-xs text-muted-foreground italic">No imaging added</p>}
                {imaging.map((im, i) => (
                  <span key={i} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-md bg-warning/10 border border-warning/25 text-xs text-warning">
                    {im}
                    <button onClick={() => removeImaging(i)} className="p-0.5 rounded hover:bg-warning/20">
                      <XCircle className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newImaging}
                  onChange={e => setNewImaging(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addImaging()}
                  placeholder="Add imaging..."
                  className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
                />
                <button onClick={addImaging} className="p-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </EditSection>
        </div>

        {/* RIGHT: Live preview */}
        <div className="flex-1 p-4 md:p-6 print:p-0">
          <div className="max-w-2xl mx-auto text-black bg-white rounded-lg print:rounded-none">
            <CallNotePreview caseData={mergedData} reasoning={reasoning} plan={plan} bloods={bloods} imaging={imaging} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EditSection({ title, icon, children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-hive-gold" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function CallNotePreview({ caseData, reasoning, plan, bloods, imaging }) {
  const printDate = new Date().toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" });
  const printTime = new Date().toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
  const inews = caseData.inews_data || {};
  const mainConcern = caseData.presenting_complaint || caseData.referral_summary || "—";

  return (
    <div className="p-6 print:p-4">
      {/* Header */}
      <div className="border-b-2 border-black pb-2 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">HIVE Surgical Assistant</p>
            <h1 className="text-lg font-bold">Inpatient After Hours Call Note</h1>
          </div>
          <p className="text-xs text-gray-500">{printDate} · {printTime}</p>
        </div>
      </div>

      {/* Patient strip */}
      <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-sm mb-3 pb-2 border-b border-gray-300">
        <p><span className="font-semibold">Patient:</span> {caseData.patient_name || "—"}</p>
        <p><span className="font-semibold">MRN:</span> {caseData.patient_mrn || "—"}</p>
        <p><span className="font-semibold">DOB:</span> {caseData.patient_dob ? new Date(caseData.patient_dob).toLocaleDateString("en-IE") : "—"}</p>
        <p><span className="font-semibold">Ward/Bed:</span> {caseData.ward || "—"}{caseData.bed_number ? ` / ${caseData.bed_number}` : ""}</p>
      </div>

      {/* Main concern */}
      <div className="border-2 border-black rounded p-3 mb-3">
        <p className="text-xs font-bold uppercase text-gray-700 mb-1">Main Concern (Referrer)</p>
        <p className="text-sm font-medium">{mainConcern}</p>
      </div>

      {/* Referrer */}
      {(caseData.referrer_name || caseData.referrer_department) && (
        <div className="flex items-start gap-2 mb-3 text-xs text-gray-700">
          <Phone className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold">Called by:</span>{" "}
            {caseData.referrer_name || "—"}
            {caseData.referrer_grade && ` (${caseData.referrer_grade})`}
            {caseData.referrer_department && `, ${caseData.referrer_department}`}
            {caseData.referrer_contact && ` · ${caseData.referrer_contact}`}
          </div>
        </div>
      )}

      {/* Vitals */}
      {(inews.hr || inews.bp_sys || inews.rr || inews.spO2 || inews.temp) && (
        <div className="mb-3">
          <p className="text-xs font-bold uppercase text-gray-600 mb-1">Vitals {caseData.inews_score != null && `(INEWS ${caseData.inews_score})`}</p>
          <p className="text-sm">
            {[
              inews.hr && `HR ${inews.hr}`,
              inews.bp_sys && `BP ${inews.bp_sys}/${inews.bp_dia || "—"}`,
              inews.rr && `RR ${inews.rr}`,
              inews.spO2 && `SpO₂ ${inews.spO2}%`,
              inews.temp && `T ${inews.temp}°C`,
              inews.avpu && `AVPU ${inews.avpu}`,
            ].filter(Boolean).join("  ·  ")}
          </p>
        </div>
      )}

      {/* Reasoning */}
      {reasoning && (
        <div className="mb-3">
          <p className="text-xs font-bold uppercase text-gray-600 mb-1">Clinical Impression</p>
          <ReasoningBullets text={reasoning} />
        </div>
      )}

      {/* Bloods */}
      {bloods.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-bold uppercase text-gray-600 mb-1">Blood Investigations</p>
          <div className="space-y-0.5">
            {bloods.map((b, i) => (
              <p key={i} className="text-sm text-black flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">-</span> {b}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Imaging */}
      {imaging.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-bold uppercase text-gray-600 mb-1">Imaging</p>
          <div className="space-y-0.5">
            {imaging.map((im, i) => (
              <p key={i} className="text-sm text-black flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">-</span> {im}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Plan */}
      {plan && (
        <div className="mb-3">
          <p className="text-xs font-bold uppercase text-gray-600 mb-1">Plan</p>
          <ReasoningBullets text={plan} />
        </div>
      )}

      {/* IV Fluids */}
      {caseData.iv_fluid_plan && (
        <div className="mb-3">
          <p className="text-xs font-bold uppercase text-gray-600 mb-1">IV Fluids</p>
          <p className="text-sm whitespace-pre-wrap">{caseData.iv_fluid_plan}</p>
        </div>
      )}

      {/* Signature lines */}
      <div className="mt-8 pt-3 border-t border-gray-300 grid grid-cols-2 gap-8">
        <div>
          <div className="border-b border-black h-6 mb-1" />
          <p className="text-xs text-gray-600">Doctor Signature / IMC</p>
        </div>
        <div>
          <div className="border-b border-black h-6 mb-1" />
          <p className="text-xs text-gray-600">Date / Time</p>
        </div>
      </div>
    </div>
  );
}

function buildEmailBody(caseData) {
  const inews = caseData.inews_data || {};
  const invData = caseData.investigation_data || {};
  const lines = [
    "HIVE SURGICAL ASSISTANT — INPATIENT AFTER HOURS CALL NOTE",
    `Generated: ${new Date().toLocaleString("en-IE")}`,
    "",
    `Patient: ${caseData.patient_name || "—"}`,
    `MRN: ${caseData.patient_mrn || "—"}`,
    `DOB: ${caseData.patient_dob ? new Date(caseData.patient_dob).toLocaleDateString("en-IE") : "—"}`,
    `Ward/Bed: ${caseData.ward || "—"}${caseData.bed_number ? ` / ${caseData.bed_number}` : ""}`,
    "",
    "MAIN CONCERN (REFERRER):",
    caseData.presenting_complaint || caseData.referral_summary || "—",
    "",
  ];

  if (caseData.referrer_name || caseData.referrer_department) {
    lines.push(`Called by: ${caseData.referrer_name || "—"}${caseData.referrer_grade ? ` (${caseData.referrer_grade})` : ""}${caseData.referrer_department ? `, ${caseData.referrer_department}` : ""}${caseData.referrer_contact ? ` · ${caseData.referrer_contact}` : ""}`);
    lines.push("");
  }

  if (inews.hr || inews.bp_sys || inews.rr || inews.spO2 || inews.temp) {
    lines.push(`VITALS${caseData.inews_score != null ? ` (INEWS ${caseData.inews_score})` : ""}:`);
    lines.push([
      inews.hr && `HR ${inews.hr}`,
      inews.bp_sys && `BP ${inews.bp_sys}/${inews.bp_dia || "—"}`,
      inews.rr && `RR ${inews.rr}`,
      inews.spO2 && `SpO2 ${inews.spO2}%`,
      inews.temp && `T ${inews.temp}°C`,
      inews.avpu && `AVPU ${inews.avpu}`,
    ].filter(Boolean).join("  ·  "));
    lines.push("");
  }

  if (caseData.triage_reasoning) { lines.push("CLINICAL IMPRESSION:", caseData.triage_reasoning, ""); }

  if (invData.bloods?.length) {
    lines.push("BLOOD INVESTIGATIONS:");
    invData.bloods.forEach(b => lines.push(`- ${b}`));
    lines.push("");
  }
  if (invData.imaging?.length) {
    lines.push("IMAGING:");
    invData.imaging.forEach(im => lines.push(`- ${im}`));
    lines.push("");
  }

  if (caseData.treatment_plan) { lines.push("PLAN:", caseData.treatment_plan, ""); }
  if (caseData.iv_fluid_plan) { lines.push("IV FLUIDS:", caseData.iv_fluid_plan, ""); }

  lines.push("", "—", "HIVE Surgical Assistant — AI-generated, verify clinically");
  return lines.join("\n");
}