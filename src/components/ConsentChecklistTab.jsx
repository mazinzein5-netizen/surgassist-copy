import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { generateConsentChecklist } from "@/lib/hiveApi";
import AIBadge from "@/components/AIBadge";
import DigitalConsentForm from "@/components/DigitalConsentForm";
import { Loader2, FileCheck, AlertTriangle, CheckCircle2, ShieldCheck, Printer, User, FileText, HeartPulse, Ban, Utensils, Gavel, FileSignature } from "lucide-react";

// HSE-standard surgical consent checklist sections
const CHECKLIST_SECTIONS = [
  {
    id: "identity",
    label: "Patient Identity & Capacity",
    icon: User,
    items: [
      "Patient identity confirmed (name, DOB, MRN) against wristband",
      "Procedure confirmed on consent form matches planned operation",
      "Patient assessed for capacity to consent (no impairment)",
      "If lacking capacity — HSE consent policy for incapacitated patients followed (ward of court / next of kin)",
    ],
  },
  {
    id: "procedure",
    label: "Procedure Explanation",
    icon: FileText,
    items: [
      "Proposed procedure explained in lay terms (site, side, approach)",
      "Expected outcome and post-operative course discussed",
      "Anaesthetic plan discussed with patient (GA/regional/local)",
      "Marking of surgical site completed per HSE site-marking policy",
    ],
  },
  {
    id: "risks",
    label: "Risks & Complications",
    icon: AlertTriangle,
    items: [
      "Common risks discussed (bleeding, infection, pain, scarring)",
      "Procedure-specific risks discussed (nerve injury, DVT/PE, implant failure)",
      "Anaesthetic risks discussed (aspiration, allergic reaction, dental damage)",
      "Patient given opportunity to ask questions — all answered",
    ],
  },
  {
    id: "benefits",
    label: "Benefits & Alternatives",
    icon: HeartPulse,
    items: [
      "Expected benefits explained (pain relief, functional improvement, curative intent)",
      "Conservative/non-operative alternatives discussed",
      "Option of deferring or declining treatment discussed",
      "Patient understands no guarantee of outcome has been given",
    ],
  },
  {
    id: "hse_admin",
    label: "HSE Administrative Requirements",
    icon: Gavel,
    items: [
      "HSE Consent Form (or electronic equivalent) signed by patient and witnessing clinician",
      "Consent obtained by a clinician with appropriate competency (not student alone)",
      "Chaperone offered if intimate examination/procedure",
      "Interpreter arranged if language barrier (HSE interpreter service)",
    ],
  },
  {
    id: "fasting",
    label: "Pre-Operative Fasting & Safety",
    icon: Utensils,
    items: [
      "Fasting confirmed: 6 hours food, 2 hours clear fluids (HSE enhanced recovery)",
      "Medications reconciled — anticoagulants/antiplatelets managed per protocol",
      "Pregnancy test completed if applicable (female patients of reproductive age)",
      "VT prophylaxis prescribed and administered (LMWH / TEDs / IPC)",
    ],
  },
  {
    id: "consent_form",
    label: "Consent Form Validation",
    icon: Ban,
    items: [
      "Consent form scanned/uploaded to case file",
      "Consenting clinician's name, grade, and IMC number recorded",
      "Date and time of consent documented",
      "Two patient identifiers present on the signed form",
    ],
  },
];

function parseChecklist(saved) {
  const state = {};
  CHECKLIST_SECTIONS.forEach(s => s.items.forEach((_, i) => { state[`${s.id}_${i}`] = false; }));
  if (!saved) return state;
  if (typeof saved === "string") {
    try { const parsed = JSON.parse(saved); return { ...state, ...parsed }; } catch { return state; }
  }
  if (typeof saved === "object") return { ...state, ...saved };
  return state;
}

export default function ConsentChecklistTab({ caseData, onUpdate, user }) {
  const [checked, setChecked] = useState(() => parseChecklist(caseData.consent_checklist));
  const [procedure, setProcedure] = useState(caseData.presenting_complaint || caseData.referral_summary || "");
  const [consentAid, setConsentAid] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggle = (key) => {
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allKeys = CHECKLIST_SECTIONS.flatMap(s => s.items.map((_, i) => `${s.id}_${i}`));
  const allChecked = allKeys.every(k => checked[k]);

  const toggleAll = () => {
    const target = !allChecked;
    setChecked(prev => {
      const next = { ...prev };
      allKeys.forEach(k => { next[k] = target; });
      return next;
    });
  };

  const totalItems = CHECKLIST_SECTIONS.reduce((n, s) => n + s.items.length, 0);
  const completedItems = Object.values(checked).filter(Boolean).length;
  const completionPct = Math.round((completedItems / totalItems) * 100);
  const isComplete = completedItems === totalItems;

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.CaseFile.update(caseData.id, {
        consent_checklist: JSON.stringify({ checked, procedure, completed_at: isComplete ? new Date().toISOString() : null }),
      });

      // Auto-create theatre list entry when consent is cleared
      if (isComplete) {
        try {
          const existing = await base44.entities.TheatreLog.filter({
            patient_mrn: caseData.patient_mrn || "",
            procedure_name: procedure || caseData.procedure_name || "",
          });
          if (existing.length === 0) {
            await base44.entities.TheatreLog.create({
              patient_name: caseData.patient_name,
              patient_mrn: caseData.patient_mrn || "",
              procedure_date: caseData.procedure_date || new Date().toISOString().split("T")[0],
              procedure_name: procedure || caseData.procedure_name || caseData.presenting_complaint || "",
              procedure_role: "first_assistant",
              department: caseData.department || "orthopaedics",
              notes: `Auto-added from consent clearance. Diagnosis: ${caseData.diagnosis || "N/A"}`,
            });
          }
        } catch (e) {
          console.error("Failed to auto-add theatre list entry:", e);
        }
      }

      onUpdate();
    } catch {
      alert("Failed to save consent checklist.");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateConsentChecklist(
        procedure,
        caseData.presenting_complaint || "",
        caseData.referral_summary || ""
      );
      setConsentAid(result.consent_aid);
    } catch {
      alert("Failed to generate consent discussion aid.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => window.print();

  // When checklist is complete AND saved, show the digital consent form instead of the checklist
  const checklistSaved = caseData.consent_checklist && (() => {
    try {
      const parsed = typeof caseData.consent_checklist === "string" ? JSON.parse(caseData.consent_checklist) : caseData.consent_checklist;
      return parsed?.completed_at != null;
    } catch { return false; }
  })();

  const showDigitalConsent = isComplete && checklistSaved;

  if (showDigitalConsent) {
    return (
      <div className="space-y-4">
        <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-success">Consent Checklist Complete</p>
            <p className="text-xs text-muted-foreground mt-0.5">All items verified. Digital consent below.</p>
          </div>
          <FileSignature className="w-5 h-5 text-success/50" />
        </div>
        <DigitalConsentForm caseData={caseData} user={user} onUpdate={onUpdate} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Completion banner */}
      <div className={`rounded-xl p-4 border flex items-center gap-3 ${isComplete ? "bg-success/10 border-success/30" : "bg-warning/10 border-warning/30"}`}>
        {isComplete ? <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />}
        <div className="flex-1">
          <p className={`text-sm font-medium ${isComplete ? "text-success" : "text-warning"}`}>
            {isComplete ? "Consent Checklist Complete — Save to Continue" : "Consent Checklist Incomplete"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedItems} of {totalItems} items verified ({completionPct}%){isComplete ? " · Save to reveal digital consent form" : ""}
          </p>
        </div>
        <div className="w-24 bg-background rounded-full h-2 flex-shrink-0">
          <div
            className={`h-2 rounded-full transition-all ${isComplete ? "bg-success" : "bg-warning"}`}
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Theatre clearance warning */}
      {!isComplete && (caseData.status === "accepted" || caseData.status === "admitted" || caseData.status === "investigations" || caseData.pre_op_status === "listed" || caseData.pre_op_status === "in_theatre") && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">
            <strong>Surgical booking blocked.</strong> All checklist items must be verified before this case is added to the surgical list.
            Complete outstanding items and save to proceed.
          </p>
        </div>
      )}

      {/* Theatre cleared badge */}
      {isComplete && (caseData.pre_op_status === "listed" || caseData.pre_op_status === "in_theatre") && (
        <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-success flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-success">Consent verified — Ready for surgical list</p>
            <p className="text-xs text-muted-foreground mt-0.5">All risks, benefits, and HSE requirements documented. Ready for procedural list.</p>
          </div>
        </div>
      )}

      {/* Procedure input + AI aid */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold text-foreground text-sm mb-3">Procedure for Consent</h3>
        <input
          type="text"
          value={procedure}
          onChange={(e) => setProcedure(e.target.value)}
          placeholder="e.g. Open reduction internal fixation right distal radius"
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50 mb-3"
        />
        {!consentAid ? (
          <div className="flex items-center gap-2">
            <AIBadge />
            <button
              onClick={handleGenerate}
              disabled={generating || !procedure}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-hive-gold text-hive-gold-foreground text-sm font-medium hover:bg-hive-gold/90 disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Generate Consent Discussion Template
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-foreground">Consent Discussion Template</h4>
              <AIBadge />
            </div>
            <pre className="text-sm text-foreground whitespace-pre-wrap font-body bg-background/50 rounded-lg p-3 border border-border">{consentAid}</pre>
          </div>
        )}
      </div>

      {/* Check All bar */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
        <button
          type="button"
          onClick={toggleAll}
          className={`w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
            allChecked ? "bg-success border-success" : "border-border hover:border-hive-gold/50"
          }`}
        >
          {allChecked && <CheckCircle2 className="w-4 h-4 text-success-foreground" />}
        </button>
        <span className="text-sm font-semibold text-foreground flex-1">
          {allChecked ? "All items checked — Uncheck all" : "Check all items"}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${allChecked ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
          {completedItems}/{totalItems}
        </span>
      </div>

      {/* Checklist sections */}
      {CHECKLIST_SECTIONS.map((section) => {
        const sectionItems = section.items;
        const sectionCompleted = sectionItems.filter((_, i) => checked[`${section.id}_${i}`]).length;
        const Icon = section.icon;
        return (
          <div key={section.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-hive-gold" />
              <h3 className="font-semibold text-foreground text-sm">{section.label}</h3>
              <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded ${sectionCompleted === sectionItems.length ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                {sectionCompleted}/{sectionItems.length}
              </span>
            </div>
            <div className="space-y-2">
              {sectionItems.map((item, i) => {
                const key = `${section.id}_${i}`;
                const isChecked = checked[key];
                return (
                  <label key={i} className="flex items-start gap-3 cursor-pointer group">
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isChecked ? "bg-success border-success" : "border-border group-hover:border-hive-gold/50"
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-success-foreground" />}
                    </button>
                    <span className={`text-sm ${isChecked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {item}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Save & Print */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-hive-gold text-hive-gold-foreground font-medium text-sm hover:bg-hive-gold/90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
          Save Checklist
        </button>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>
    </div>
  );
}