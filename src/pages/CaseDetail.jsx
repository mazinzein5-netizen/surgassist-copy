import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { generateKardex, generateDischargeDocuments, generateConsentChecklist, generateInvestigationPlan, generatePreClerkingGuidance, generateAdmissionNote, uploadFile, suggestManagementPlan } from "@/lib/hiveApi";

import AIBadge from "@/components/AIBadge";
import HexBadge from "@/components/HexBadge";

import { ArrowLeft, Loader2, Camera, FileText, Pill, FileCheck, Send, Printer, Stethoscope, Activity, ClipboardCheck, Eye, Hand, AlertTriangle, CheckCircle2, Edit3, ShieldCheck, ListChecks, Scan, ScrollText, Sparkles, FlaskConical, ChevronUp, ChevronDown, Download, Users, Lock } from "lucide-react";
import ConsentChecklistTab from "@/components/ConsentChecklistTab";
import InvestigationPrompts from "@/components/InvestigationPrompts";
import ShareNoteButtons from "@/components/ShareNoteButtons";
import PrintPlanNote from "@/components/PrintPlanNote";
import ClerkingTab from "@/components/ClerkingTab";
import ReasoningBullets from "@/components/ReasoningBullets";
import ImagingReports from "@/components/ImagingReports";
import { compileProformaLines } from "@/components/OrthoProforma";
import { downloadCallNotePDF } from "@/lib/pdfExport";
import ReviewInvestigations from "@/components/ReviewInvestigations";
import BeeMonitor from "@/components/BeeMonitor";
import ExportShareDialog from "@/components/ExportShareDialog";
import JackSafetyPanel from "@/components/JackSafetyPanel";
import LabsImagingDiscovery from "@/components/LabsImagingDiscovery";

const TABS = [
  { id: "summary", label: "Summary", icon: FileText },
  { id: "clerking", label: "Clerking", icon: Stethoscope },
  { id: "imaging", label: "Imaging", icon: Scan },
  { id: "kardex", label: "Kardex", icon: Pill },
  { id: "consent", label: "Consent", icon: ShieldCheck },
  { id: "review", label: "Review", icon: ClipboardCheck },
  { id: "discharge", label: "Discharge", icon: FileCheck },
];

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [photos, setPhotos] = useState([]);
  const [showPrintNote, setShowPrintNote] = useState(false);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    loadCase();
  }, [id]);

  const loadCase = async () => {
    try {
      const data = await base44.entities.CaseFile.get(id);
      setCaseData(data);
      try {
        const photoData = await base44.entities.ClinicalPhoto.filter({ case_id: id });
        setPhotos(photoData);
      } catch {}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-border border-t-hive-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Case not found.</p>
        <Link to="/cases" className="text-hive-gold hover:underline mt-2 inline-block">← Back to cases</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-4 md:px-8 py-4 bg-card/50">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate("/cases")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-3 h-3" /> Back to Cases
          </button>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-lg md:text-xl font-bold text-foreground">{caseData.patient_name}</h1>
                <HexBadge status={caseData.status} />
                {caseData.review_status === "countersigned" && <HexBadge status="countersigned" />}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                {caseData.patient_mrn && <span>MRN: {caseData.patient_mrn}</span>}
                {caseData.patient_dob && <span>DOB: {new Date(caseData.patient_dob).toLocaleDateString("en-IE")}</span>}
                <span className="capitalize">{caseData.department?.replace("_", " ")}</span>
                <span>{new Date(caseData.created_date).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            </div>
          </div>

          {/* Team Labels */}
          <TeamLabels caseData={caseData} />

          {/* Admission Info Bar */}
          <AdmissionInfoBar caseData={caseData} />

          {/* Export & Share + Print Plan buttons */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowExport(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-hive-gold text-hive-gold-foreground text-xs font-semibold hover:bg-hive-gold/90 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export & Share
            </button>
            {(caseData.status === "inews_consult" || caseData.status === "admitted") && (
              <button
                onClick={() => setShowPrintNote(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-hive-gold/10 border border-hive-gold/30 text-hive-gold text-xs font-semibold hover:bg-hive-gold/20 transition-colors"
              >
                <ScrollText className="w-3.5 h-3.5" />
                Print Call Note & Plan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border px-4 md:px-8 bg-card/30">
        <div className="max-w-5xl mx-auto flex gap-1 overflow-x-auto scrollbar-thin">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const showConsentWarning = tab.id === "consent" && isConsentIncomplete(caseData);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? "border-hive-gold text-hive-gold" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {showConsentWarning && (
                  <span className="w-2 h-2 rounded-full bg-destructive animate-pulse-gold" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {activeTab === "summary" && <SummaryTab caseData={caseData} />}
          {activeTab === "clerking" && <ClerkingTab caseData={caseData} photos={photos} caseId={id} onPhotoAdded={loadCase} />}
          {activeTab === "imaging" && <ImagingReports caseData={caseData} photos={photos} caseId={id} onPhotoAdded={loadCase} />}
          {activeTab === "kardex" && <KardexTab caseData={caseData} onUpdate={loadCase} user={user} />}
          {activeTab === "discharge" && <DischargeTab caseData={caseData} onUpdate={loadCase} user={user} />}
          {activeTab === "consent" && <ConsentChecklistTab caseData={caseData} onUpdate={loadCase} user={user} />}
          {activeTab === "review" && <ReviewTab caseData={caseData} onUpdate={loadCase} user={user} />}
        </div>
      </div>

      {showPrintNote && (
        <PrintPlanNote caseData={caseData} onClose={() => setShowPrintNote(false)} onUpdate={loadCase} />
      )}

      {showExport && (
        <ExportShareDialog caseData={caseData} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}

function SummaryTab({ caseData }) {
  const proformaLines = compileProformaLines(caseData.proforma_data, caseData);

  return (
    <div className="space-y-4">
      {proformaLines.length > 0 && (
        <Section title="Key Clinical Highlights" icon={Activity}>
          <div className="space-y-2">
            {proformaLines.map((group, gi) => (
              <div key={gi}>
                <p className="text-xs font-semibold text-accent uppercase mb-0.5">{group.section}</p>
                {group.lines.map((line, li) => (
                  <p key={li} className="text-sm text-foreground pl-3">- {line}</p>
                ))}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Referral Summary" icon={FileText}>
        <p className="text-sm text-foreground whitespace-pre-wrap">{caseData.referral_summary || "No referral summary recorded."}</p>
        {caseData.referral_mode && (
          <p className="text-xs text-muted-foreground mt-2">Input mode: <span className="capitalize">{caseData.referral_mode}</span></p>
        )}
      </Section>

      {caseData.admission_note && (
        <Section title="Admission Note" icon={FileText} noteAuthor={caseData.note_author_name} noteLockedAt={caseData.note_locked_at}>
          <pre className="text-sm text-foreground whitespace-pre-wrap font-body">{caseData.admission_note}</pre>
          <button
            onClick={() => {
              const el = document.createElement("textarea");
              el.value = caseData.admission_note;
              document.body.appendChild(el);
              el.select();
              document.execCommand("copy");
              document.body.removeChild(el);
            }}
            className="mt-2 text-xs text-hive-gold hover:underline"
          >
            Copy to clipboard
          </button>
        </Section>
      )}

      {caseData.triage_decision && caseData.triage_decision !== "pending" && (
        <Section title="Triage Decision" icon={CheckCircle2}>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-3 ${
            caseData.triage_decision === "accept" ? "bg-success/15 text-success" :
            caseData.triage_decision === "decline" ? "bg-destructive/15 text-destructive" :
            "bg-warning/15 text-warning"
          }`}>
            <span className="font-bold text-sm uppercase">
              {caseData.triage_decision === "accept" && caseData.accepting_specialty
                ? `Accepted — ${caseData.accepting_specialty}`
                : caseData.triage_decision.replace("_", " ")}
            </span>
          </div>
          {caseData.triage_reasoning && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Reasoning</p>
              <p className="text-sm text-foreground">{caseData.triage_reasoning}</p>
            </div>
          )}
          {caseData.triage_guideline && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Guideline Applied</p>
              <p className="text-sm text-foreground">{caseData.triage_guideline}</p>
            </div>
          )}
        </Section>
      )}

      {caseData.pre_clerking_guidance && (
        <Section title="Pre-Clerking Guidance" icon={Stethoscope}>
          <AIBadge />
          <p className="text-sm text-foreground whitespace-pre-wrap mt-2">{caseData.pre_clerking_guidance}</p>
        </Section>
      )}

      {caseData.presenting_complaint && (
        <Section title="Presenting Complaint" icon={Activity}>
          <p className="text-sm text-foreground">{caseData.presenting_complaint}</p>
        </Section>
      )}
    </div>
  );
}

function KardexTab({ caseData, onUpdate, user }) {
  const [kardex, setKardex] = useState(caseData.kardex_data || null);
  const [generating, setGenerating] = useState(false);
  const [medUrl, setMedUrl] = useState(null);
  const [comorbidities, setComorbidities] = useState("");
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadFile(file);
      setMedUrl(result.file_url);
    } catch {
      alert("Failed to upload image.");
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateKardex(medUrl, caseData.referral_summary, comorbidities, caseData.presenting_complaint);
      setKardex(result);
      await base44.entities.CaseFile.update(caseData.id, {
        kardex_data: result,
        iv_fluid_plan: result.iv_fluids,
        treatment_plan: result.treatment_plan,
        status: "admitted",
        admission_date: caseData.admission_date || new Date().toISOString(),
        note_author_name: user?.full_name || "Unknown",
        note_author_grade: user?.clinical_grade || "nchd",
        note_author_imc: user?.imc_number || "",
        note_locked_at: new Date().toISOString(),
      });
      onUpdate();
    } catch {
      alert("Failed to generate kardex.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {!kardex && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-2">Generate Inpatient Kardex</h3>
          <p className="text-sm text-muted-foreground mb-4">Upload a photo of the patient's medications for a tailored kardex, or generate a generic baseline kardex based on demographics and comorbidities.</p>
          <AIBadge />
          <div className="mt-3 mb-4">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Known Comorbidities</label>
            <textarea
              value={comorbidities}
              onChange={(e) => setComorbidities(e.target.value)}
              rows={2}
              placeholder="e.g. T2DM, HTN, AF on warfarin, CKD stage 3"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50 resize-none"
            />
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} />
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80">
              <Camera className="w-4 h-4" /> Upload Medication List
            </button>
            {medUrl && (
              <>
                <img src={medUrl} alt="meds" className="w-16 h-16 rounded-lg object-cover border border-border" />
                <button onClick={handleGenerate} disabled={generating} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-hive-gold text-hive-gold-foreground text-sm font-medium hover:bg-hive-gold/90">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pill className="w-4 h-4" />} Generate Tailored Kardex
                </button>
              </>
            )}
            {!medUrl && (
              <button onClick={handleGenerate} disabled={generating} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pill className="w-4 h-4" />} Generate Generic Kardex
              </button>
            )}
          </div>
        </div>
      )}

      {kardex && (
        <>
          <BeeMonitor caseData={caseData} kardex={kardex} />

          {kardex.alerts?.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="font-semibold text-destructive text-sm">Contraindication Alerts</span>
              </div>
              <ul className="space-y-1">
                {kardex.alerts.map((a, i) => <li key={i} className="text-sm text-destructive">• {a}</li>)}
              </ul>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-foreground text-sm">Inpatient Kardex — {caseData.patient_name}</h3>
              <div className="flex items-center gap-2">
                <AIBadge />
                <button onClick={handlePrint} className="p-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80">
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left px-4 py-2 font-medium">Drug (Generic)</th>
                    <th className="text-left px-4 py-2 font-medium">Dose</th>
                    <th className="text-left px-4 py-2 font-medium">Route</th>
                    <th className="text-left px-4 py-2 font-medium">Frequency</th>
                    <th className="text-left px-4 py-2 font-medium">Indication</th>
                    <th className="text-left px-4 py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {kardex.medications?.map((med, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="px-4 py-3 font-medium text-foreground">{med.drug}</td>
                      <td className="px-4 py-3 text-foreground">{med.dose}</td>
                      <td className="px-4 py-3 text-foreground">{med.route}</td>
                      <td className="px-4 py-3 text-foreground">{med.frequency}</td>
                      <td className="px-4 py-3 text-muted-foreground">{med.indication}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{med.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {kardex.iv_fluids && (
            <Section title="IV Fluid Plan" icon={Activity}>
              <p className="text-sm text-foreground whitespace-pre-wrap">{kardex.iv_fluids}</p>
            </Section>
          )}
          {kardex.treatment_plan && (
            <Section title="Treatment Plan" icon={ClipboardCheck}>
              <p className="text-sm text-foreground whitespace-pre-wrap">{kardex.treatment_plan}</p>
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function DischargeTab({ caseData, onUpdate, user }) {
  const [pathway, setPathway] = useState(caseData.discharge_pathway || "not_discharged");
  const [docs, setDocs] = useState({
    gp_letter: caseData.gp_letter || "",
    patient_education_sheet: caseData.patient_education_sheet || "",
  });
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateDischargeDocuments(caseData.presenting_complaint, caseData.referral_summary, pathway, caseData.patient_name);
      setDocs(result);
      await base44.entities.CaseFile.update(caseData.id, {
        discharge_pathway: pathway,
        gp_letter: result.gp_letter,
        patient_education_sheet: result.patient_education_sheet,
        status: "discharged",
        note_author_name: user?.full_name || "Unknown",
        note_author_grade: user?.clinical_grade || "nchd",
        note_author_imc: user?.imc_number || "",
        note_locked_at: new Date().toISOString(),
      });
      onUpdate();
    } catch {
      alert("Failed to generate discharge documents.");
    } finally {
      setGenerating(false);
    }
  };

  const handleEmail = async (type) => {
    const email = prompt(`Enter ${type === "patient" ? "patient" : "GP"} email address:`);
    if (!email) return;
    setSending(true);
    try {
      const body = type === "patient" ? docs.patient_education_sheet : docs.gp_letter;
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `HIVE Surgical Assistant — ${caseData.patient_name} — Discharge Summary`,
        body,
      });
      alert("Email sent successfully.");
    } catch {
      alert("Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      {pathway === "not_discharged" && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-3">Discharge Pathway</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <button onClick={() => setPathway("opd_followup")} className="p-4 rounded-lg border border-border hover:border-hive-gold/30 text-left transition-colors">
              <FileCheck className="w-5 h-5 text-hive-gold mb-2" />
              <div className="font-medium text-sm text-foreground">OPD Follow-Up</div>
              <div className="text-xs text-muted-foreground mt-1">Full GP letter with follow-up plan</div>
            </button>
            <button onClick={() => setPathway("no_followup")} className="p-4 rounded-lg border border-border hover:border-hive-gold/30 text-left transition-colors">
              <FileCheck className="w-5 h-5 text-hive-gold mb-2" />
              <div className="font-medium text-sm text-foreground">No Follow-Up</div>
              <div className="text-xs text-muted-foreground mt-1">Condensed safety-net letter</div>
            </button>
          </div>
        </div>
      )}

      {pathway !== "not_discharged" && !docs.gp_letter && (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <AIBadge />
          <p className="text-sm text-muted-foreground mt-3 mb-4">Generate discharge documents for: <span className="font-medium text-foreground">{pathway === "opd_followup" ? "OPD Follow-Up" : "No Follow-Up (Safety-Net)"}</span></p>
          <button onClick={handleGenerate} disabled={generating} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-hive-gold text-hive-gold-foreground font-medium text-sm hover:bg-hive-gold/90">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />} Generate Documents
          </button>
        </div>
      )}

      {docs.gp_letter && (
        <>
          <Section title="GP Discharge Letter" icon={FileText} noteAuthor={caseData.note_author_name} noteLockedAt={caseData.note_locked_at}>
            <AIBadge />
            <pre className="text-sm text-foreground whitespace-pre-wrap mt-2 font-body">{docs.gp_letter}</pre>
          </Section>

          <Section title="Patient Education Sheet" icon={FileCheck} noteAuthor={caseData.note_author_name} noteLockedAt={caseData.note_locked_at}>
            <AIBadge />
            <pre className="text-sm text-foreground whitespace-pre-wrap mt-2 font-body">{docs.patient_education_sheet}</pre>
          </Section>

          <div className="bg-card border border-border rounded-xl p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">Delivery Options</h4>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleEmail("patient")} disabled={sending} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm hover:bg-secondary/80">
                <Send className="w-4 h-4" /> Email Patient
              </button>
              <button onClick={() => handleEmail("gp")} disabled={sending} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm hover:bg-secondary/80">
                <Send className="w-4 h-4" /> Email GP
              </button>
              <button onClick={handlePrint} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm hover:bg-secondary/80">
                <Printer className="w-4 h-4" /> Print (WiFi/BT)
              </button>
            </div>
            {sending && <p className="text-xs text-muted-foreground mt-2">Sending...</p>}
          </div>
        </>
      )}
    </div>
  );
}

function ReviewTab({ caseData, onUpdate, user }) {
  const [notes, setNotes] = useState(caseData.review_notes || "");
  const [plan, setPlan] = useState(caseData.treatment_plan || "");
  const [signing, setSigning] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [suggestingPlan, setSuggestingPlan] = useState(false);
  const [showMeds, setShowMeds] = useState(false);
  // All team members can edit review notes and management plan
  const canEdit = true;
  // Only senior grades can countersign
  const canCountersign = user?.clinical_grade === "sho" || user?.clinical_grade === "registrar" || user?.clinical_grade === "consultant";

  const handleSavePlan = async () => {
    setSavingPlan(true);
    try {
      await base44.entities.CaseFile.update(caseData.id, {
        treatment_plan: plan,
        note_author_name: user?.full_name || "Unknown",
        note_author_grade: user?.clinical_grade || "nchd",
        note_author_imc: user?.imc_number || "",
        note_locked_at: new Date().toISOString(),
      });
      onUpdate();
    } catch {
      alert("Failed to save plan.");
    } finally {
      setSavingPlan(false);
    }
  };

  const handleSuggestPlan = async () => {
    setSuggestingPlan(true);
    try {
      const suggested = await suggestManagementPlan(caseData);
      setPlan(suggested);
      await base44.entities.CaseFile.update(caseData.id, {
        treatment_plan: suggested,
        note_author_name: user?.full_name || "Unknown",
        note_author_grade: user?.clinical_grade || "nchd",
        note_author_imc: user?.imc_number || "",
        note_locked_at: new Date().toISOString(),
      });
      onUpdate();
    } catch {
      alert("Failed to generate plan.");
    } finally {
      setSuggestingPlan(false);
    }
  };

  const handlePrintPDF = () => {
    downloadCallNotePDF({ ...caseData, treatment_plan: plan });
  };

  const handleCountersign = async () => {
    setSigning(true);
    try {
      await base44.entities.CaseFile.update(caseData.id, {
        review_status: "countersigned",
        reviewed_by_id: user?.id,
        reviewer_imc: user?.imc_number || "",
        review_notes: notes,
        countersigned_at: new Date().toISOString(),
        note_author_name: user?.full_name || "Unknown",
        note_author_grade: user?.clinical_grade || "nchd",
        note_author_imc: user?.imc_number || "",
        note_locked_at: new Date().toISOString(),
      });
      await base44.entities.ReviewLog.create({
        case_id: caseData.id,
        reviewer_name: user?.full_name || "Unknown",
        reviewer_imc: user?.imc_number || "",
        reviewer_grade: user?.clinical_grade || "nchd",
        action: "countersigned",
        notes,
      });
      onUpdate();
    } catch {
      alert("Failed to countersign.");
    } finally {
      setSigning(false);
    }
  };

  const kardex = caseData.kardex_data;
  const hasMeds = kardex?.medications && kardex.medications.length > 0;

  return (
    <div className="space-y-4">
      {/* Jack — Safety & Guidelines Guardian (background) */}
      <JackSafetyPanel caseData={caseData} />

      {/* Labs & Imaging Discovery (background) */}
      <LabsImagingDiscovery caseData={caseData} />

      {/* Info banner for non-senior users */}
      {!canCountersign && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
          <p className="text-sm text-warning">You can edit notes and the management plan. Countersigning requires SHO grade or above.</p>
        </div>
      )}

      <Section title="Case Review" icon={ClipboardCheck}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-background/50 rounded-lg px-3 py-2 border border-border/50">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Referral Time</p>
              <p className="text-sm text-foreground">{new Date(caseData.created_date).toLocaleString("en-IE")}</p>
            </div>
            <div className="bg-background/50 rounded-lg px-3 py-2 border border-border/50">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Note Time</p>
              <p className="text-sm text-foreground">{caseData.countersigned_at ? new Date(caseData.countersigned_at).toLocaleString("en-IE") : new Date().toLocaleString("en-IE")}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Triage Decision</p>
            <p className="text-sm text-foreground capitalize">{caseData.triage_decision?.replace("_", " ") || "N/A"}</p>
          </div>
          {caseData.triage_reasoning && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Reasoning</p>
              <ReasoningBullets text={caseData.triage_reasoning} />
            </div>
          )}
        </div>
      </Section>

      <Section title="Investigations" icon={FlaskConical}>
        <ReviewInvestigations caseData={caseData} onUpdate={onUpdate} canEdit={canEdit} />
      </Section>

      {/* Medications quick-view button */}
      {hasMeds && (
        <Section title="Medications" icon={Pill}>
          <button
            onClick={() => setShowMeds(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <span className="text-sm font-medium text-foreground flex items-center gap-2">
              <Pill className="w-4 h-4 text-hive-gold" />
              View Inpatient Medications ({kardex.medications.length})
            </span>
            {showMeds ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showMeds && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left px-3 py-2 font-medium">Drug</th>
                    <th className="text-left px-3 py-2 font-medium">Dose</th>
                    <th className="text-left px-3 py-2 font-medium">Route</th>
                    <th className="text-left px-3 py-2 font-medium">Frequency</th>
                    <th className="text-left px-3 py-2 font-medium">Indication</th>
                  </tr>
                </thead>
                <tbody>
                  {kardex.medications.map((med, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="px-3 py-2 font-medium text-foreground">{med.drug}</td>
                      <td className="px-3 py-2 text-foreground">{med.dose}</td>
                      <td className="px-3 py-2 text-foreground">{med.route}</td>
                      <td className="px-3 py-2 text-foreground">{med.frequency}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{med.indication}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {kardex.iv_fluids && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">IV Fluids</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{kardex.iv_fluids}</p>
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      <Section title="Management Plan" icon={ClipboardCheck} noteAuthor={caseData.note_author_name} noteLockedAt={caseData.note_locked_at}>
        <div className="space-y-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <AIBadge />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSuggestPlan}
                  disabled={suggestingPlan}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/30 text-accent text-xs font-semibold hover:bg-accent/20 disabled:opacity-40"
                >
                  {suggestingPlan ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI Suggest Plan
                </button>
                <button
                  onClick={handleSavePlan}
                  disabled={savingPlan}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-hive-gold/10 border border-hive-gold/30 text-hive-gold text-xs font-semibold hover:bg-hive-gold/20 disabled:opacity-40"
                >
                  {savingPlan ? <Loader2 className="w-3 h-3 animate-spin" /> : <ClipboardCheck className="w-3 h-3" />}
                  Save Plan
                </button>
              </div>
            </div>
            <textarea
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              rows={6}
              placeholder="Edit the management plan, or click AI Suggest Plan..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50 resize-none"
            />
          </div>
        </div>
      </Section>

      <Section title="Review Notes" icon={Edit3} noteAuthor={caseData.note_author_name} noteLockedAt={caseData.note_locked_at}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Add your review notes, annotations, or changes needed..."
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50 resize-none"
        />
      </Section>

      {caseData.review_status === "countersigned" && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <div>
            <p className="text-sm font-medium text-success">Countersigned</p>
            <p className="text-xs text-muted-foreground">
              By Dr. {user?.full_name} · IMC: {caseData.reviewer_imc || "N/A"}
              {caseData.countersigned_at && ` · ${new Date(caseData.countersigned_at).toLocaleString("en-IE")}`}
            </p>
          </div>
        </div>
      )}

      {canCountersign && caseData.review_status !== "countersigned" && (
        <div className="flex gap-2">
          <button
            onClick={handleCountersign}
            disabled={signing}
            className="flex-1 px-4 py-3 rounded-lg bg-hive-gold text-hive-gold-foreground font-semibold text-sm hover:bg-hive-gold/90 flex items-center justify-center gap-2"
          >
            {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
            Countersign (IMC: {user?.imc_number || "N/A"})
          </button>
          <button
            onClick={handlePrintPDF}
            className="px-4 py-3 rounded-lg bg-secondary border border-border text-foreground font-semibold text-sm hover:bg-secondary/80 flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print PDF
          </button>
        </div>
      )}

      {caseData.review_status === "countersigned" && (
        <button
          onClick={handlePrintPDF}
          className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground font-semibold text-sm hover:bg-secondary/80 flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Print Signed Note (PDF)
        </button>
      )}
    </div>
  );
}

function isConsentIncomplete(caseData) {
  const theatreBound = caseData.pre_op_status === "listed" || caseData.pre_op_status === "in_theatre" ||
    caseData.status === "accepted" || caseData.status === "admitted" || caseData.status === "investigations";
  if (!theatreBound) return false;
  if (!caseData.consent_checklist) return true;
  try {
    const parsed = typeof caseData.consent_checklist === "string"
      ? JSON.parse(caseData.consent_checklist)
      : caseData.consent_checklist;
    const checked = parsed.checked || {};
    return !Object.values(checked).every(Boolean);
  } catch {
    return true;
  }
}

const PREOP_LABELS = {
  not_listed: "Not Listed",
  listed: "Listed",
  in_theatre: "In Theatre",
  post_op: "Post-Op",
  not_applicable: "N/A",
};

function AdmissionInfoBar({ caseData }) {
  const admitted = caseData.admission_date ? new Date(caseData.admission_date) : null;
  const procDate = caseData.procedure_date ? new Date(caseData.procedure_date) : null;
  const pod = procDate ? Math.floor((new Date() - procDate) / (1000 * 60 * 60 * 24)) : null;

  const items = [
    {
      label: "Admitted",
      value: admitted ? admitted.toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" }) : "Not admitted",
      highlight: !admitted,
    },
    {
      label: "Pre-Op Status",
      value: PREOP_LABELS[caseData.pre_op_status] || "Not Listed",
      highlight: caseData.pre_op_status === "listed" || caseData.pre_op_status === "in_theatre",
    },
    {
      label: "POD",
      value: pod !== null ? `Day ${pod}` : "—",
    },
    {
      label: "Procedure",
      value: caseData.procedure_name || "Not listed",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
      {items.map((item) => (
        <div key={item.label} className={`rounded-lg px-3 py-2 border ${item.highlight ? "bg-hive-gold/10 border-hive-gold/30" : "bg-background border-border"}`}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
          <p className={`text-sm font-medium ${item.highlight ? "text-hive-gold" : "text-foreground"}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function TeamLabels({ caseData }) {
  const labels = [];
  if (caseData.specialty || caseData.accepting_specialty) {
    labels.push({ icon: Stethoscope, text: caseData.accepting_specialty || caseData.specialty, color: "accent" });
  }
  if (caseData.on_call_consultant) {
    labels.push({ icon: Users, text: `Consultant: ${caseData.on_call_consultant}`, color: "gold" });
  }
  if (caseData.on_call_registrar) {
    labels.push({ icon: Users, text: `Registrar: ${caseData.on_call_registrar}`, color: "gold" });
  }
  if (caseData.on_call_sho) {
    labels.push({ icon: Users, text: `SHO: ${caseData.on_call_sho}`, color: "gold" });
  }
  if (caseData.referring_team) {
    labels.push({ icon: Send, text: `Ref: ${caseData.referring_team}`, color: "accent" });
  }
  if (caseData.note_locked_at) {
    labels.push({ icon: Lock, text: `Locked: ${new Date(caseData.note_locked_at).toLocaleString("en-IE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`, color: "muted" });
  }

  if (labels.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
      {labels.map((label, i) => {
        const Icon = label.icon;
        const colorClass = label.color === "gold"
          ? "bg-hive-gold/10 text-hive-gold border-hive-gold/20"
          : label.color === "accent"
          ? "bg-accent/10 text-accent border-accent/20"
          : "bg-secondary text-muted-foreground border-border";
        return (
          <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${colorClass}`}>
            <Icon className="w-2.5 h-2.5" />
            {label.text}
          </span>
        );
      })}
    </div>
  );
}

function Section({ title, icon: Icon, children, noteAuthor, noteLockedAt, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded-xl">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-secondary/30 transition-colors rounded-t-xl"
      >
        {Icon && <Icon className="w-4 h-4 text-hive-gold flex-shrink-0" />}
        <h3 className="font-semibold text-foreground text-sm flex-1">{title}</h3>
        {(noteAuthor || noteLockedAt) && (
          <span className="text-[10px] text-muted-foreground hidden sm:inline-flex items-center gap-1">
            {noteAuthor && <><Lock className="w-2.5 h-2.5" />{noteAuthor}</>}
            {noteLockedAt && <span className="ml-1">· {new Date(noteLockedAt).toLocaleString("en-IE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
          </span>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}