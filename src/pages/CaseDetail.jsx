import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { generateKardex, generateDischargeDocuments, suggestManagementPlan, uploadFile } from "@/lib/hiveApi";

import { ArrowLeft, Loader2, FileText, Pill, FileCheck, Send, Printer, Stethoscope, ClipboardCheck, AlertTriangle, CheckCircle2, ShieldCheck, FlaskConical, Download, Calculator, MessageSquare, User, Sparkles, Share2, Camera, Calendar, Trash2 } from "lucide-react";
import ConsentChecklistTab from "@/components/ConsentChecklistTab";
import ClerkingTab from "@/components/ClerkingTab";
import ReasoningBullets from "@/components/ReasoningBullets";
import ImagingReports from "@/components/ImagingReports";
import { downloadCallNotePDF, downloadKardexPDF, downloadDischargeSummaryPDF } from "@/lib/pdfExport";
import ReviewInvestigations from "@/components/ReviewInvestigations";
import BeeMonitor from "@/components/BeeMonitor";
import ExportShareDialog from "@/components/ExportShareDialog";
import JackSafetyPanel from "@/components/JackSafetyPanel";
import LabsImagingDiscovery from "@/components/LabsImagingDiscovery";
import DrugCalculatorPanel from "@/components/DrugCalculatorPanel";
import BloodsCameraButton from "@/components/BloodsCameraButton";
import FormattedAdmissionNote from "@/components/FormattedAdmissionNote";
import VTEProphylaxisPanel from "@/components/VTEProphylaxisPanel";
import PrintPlanNote from "@/components/PrintPlanNote";
import CollapsibleCard from "@/components/CollapsibleCard";
import ReferralSummaryCard from "@/components/ReferralSummaryCard";
import { detectTimeSensitiveConditions } from "@/lib/timeSensitiveCases";
import WorkflowStepper from "@/components/WorkflowStepper";
import TriageChat from "@/components/TriageChat";
import PathwayActions from "@/components/PathwayActions";
import StatusPill from "@/components/StatusPill";
import ProformaModal from "@/components/ProformaModal";
import AdmissionNotePanel from "@/components/AdmissionNotePanel";
import InpatientNotePanel from "@/components/InpatientNotePanel";
import OperativeNotePanel from "@/components/OperativeNotePanel";
import PatientInfoEditor from "@/components/PatientInfoEditor";
import DiagnosisEditor from "@/components/DiagnosisEditor";
import TheatreChecklistPanel from "@/components/TheatreChecklistPanel";
import InpatientOverview from "@/components/InpatientOverview";
import CaseRecordTimeline from "@/components/CaseRecordTimeline";
import { formatTimestamp } from "@/lib/workflow";
import AIBadge from "@/components/AIBadge";
import { Scissors as ScissorsIcon } from "lucide-react";

const PREOP_LABELS = {
  not_listed: "Not Listed",
  listed: "Listed",
  in_theatre: "In Theatre",
  post_op: "Post-Op",
  not_applicable: "N/A",
};

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [showPrintNote, setShowPrintNote] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showDrugCalc, setShowDrugCalc] = useState(false);
  const [showProforma, setShowProforma] = useState(false);
  const [showAdmissionNote, setShowAdmissionNote] = useState(false);
  const [showInpatientNote, setShowInpatientNote] = useState(false);
  const [showOperativeNote, setShowOperativeNote] = useState(false);
  const [showPatientInfo, setShowPatientInfo] = useState(false);
  const [showTheatreChecklist, setShowTheatreChecklist] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [proformaOpen, setProformaOpen] = useState(false);

  useEffect(() => { loadCase(); }, [id]);

  const loadCase = async () => {
    try {
      const data = await base44.entities.CaseFile.get(id);
      setCaseData(data);
      try {
        const photoData = await base44.entities.ClinicalPhoto.filter({ case_id: id });
        setPhotos(photoData);
      } catch {}
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Case not found.</p>
        <Link to="/" className="text-gray-700 hover:underline mt-2 inline-block">← Back to referrals</Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm(`Delete ${caseData.patient_name}'s case file? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await base44.entities.CaseFile.delete(caseData.id);
      navigate("/");
    } catch { alert("Failed to delete case."); }
    finally { setDeleting(false); }
  };

  const clinicalHistory = extractClinicalHistory(caseData);
  const isAdmitted = ["admitted", "discharge_ready", "discharged"].includes(caseData.status);
  const hasNewNursingIssue = caseData.status === "inews_consult";
  const shouldShowProforma = !isAdmitted || hasNewNursingIssue;
  const timeSensitiveFlags = detectTimeSensitiveConditions(caseData);
  const hasLabs = caseData.investigation_data?.bloods?.length > 0;
  const hasExam = (caseData.proforma_data && Object.values(caseData.proforma_data).some(a => a.answer !== null)) || caseData.admission_note;
  const hasAdmissionNote = !!caseData.admission_note;
  const isConservative = caseData.pre_op_status === "not_applicable";
  const isOperative = ["listed", "in_theatre", "post_op"].includes(caseData.pre_op_status);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 md:px-8 py-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate("/")} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 mb-2">
            <ArrowLeft className="w-3 h-3" /> Back to Referrals
          </button>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold text-gray-900">{caseData.patient_name}</h1>
                <TreatmentPathwayBadge caseData={caseData} />
                <button onClick={() => setShowPatientInfo(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors"
                  title="Edit patient details">
                  <User className="w-3.5 h-3.5" /> Edit Info
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                  title="Delete case">
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete
                </button>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                {caseData.patient_mrn && <span>MRN: {caseData.patient_mrn}</span>}
                {caseData.patient_dob && <span>DOB: {new Date(caseData.patient_dob).toLocaleDateString("en-GB")}</span>}
                <span className="capitalize">{caseData.department?.replace("_", " ")}</span>
                <DiagnosisEditor caseData={caseData} onUpdate={loadCase} />
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <StatusPill caseData={caseData} />
                <span className="text-xs text-gray-400">{formatTimestamp(caseData.created_date)}</span>
              </div>
            </div>
          </div>

          {/* Workflow Stepper */}
          <div className="mt-4">
            <WorkflowStepper caseData={caseData} />
          </div>

          {/* Action buttons */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowExport(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export & Share
            </button>
            {(caseData.status === "inews_consult" || caseData.status === "admitted") && (
              <button onClick={() => setShowPrintNote(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors">
                <Printer className="w-3.5 h-3.5" /> Print Plan
              </button>
            )}
            <button onClick={() => setShowDrugCalc(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors">
              <Calculator className="w-3.5 h-3.5" /> Drug Calculator
            </button>
            <button onClick={() => setShowProforma(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors">
              <Stethoscope className="w-3.5 h-3.5" /> Proforma
            </button>
            <button onClick={() => setShowAdmissionNote(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors">
              <FileText className="w-3.5 h-3.5" /> Admission Note
            </button>
            <button onClick={() => setShowInpatientNote(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors">
              <Stethoscope className="w-3.5 h-3.5" /> Inpatient Note
            </button>
            {!isConservative && (
              <button onClick={() => setShowTheatreChecklist(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 text-xs font-semibold hover:bg-orange-100 transition-colors border border-orange-200">
                <ScissorsIcon className="w-3.5 h-3.5" /> Book for Surgery
              </button>
            )}
            {!isConservative && (
              <button onClick={() => setShowOperativeNote(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors">
                <FileText className="w-3.5 h-3.5" /> Operative Note
              </button>
            )}
            <BloodsCameraButton caseData={caseData} onUpdate={loadCase} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* 0. Referral Summary & Admission Note — pinned to top */}
          <CollapsibleCard title="Referral Summary" icon={FileText} defaultOpen={false}
            collapsedSummary={
              <p className="text-xs text-gray-500 truncate">{caseData.presenting_complaint || caseData.referral_summary || "No summary"}</p>
            }
          >
            <ReferralSummaryCard caseData={caseData} />

            {/* Triage Chat pinned to referral inputs */}
            <div className="pt-3 border-t border-gray-100">
              <TriageChat caseId={id} caseData={caseData} />
            </div>
          </CollapsibleCard>

          {/* Admission & Plan — directly below referral */}
          <CollapsibleCard title="Admission & Plan" icon={ClipboardCheck}
            badge={hasAdmissionNote ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-600 border border-green-200">✓ ADMITTED</span> : null}
            collapsedSummary={
              <p className="text-xs text-gray-500">{hasAdmissionNote ? "Admission note saved" : caseData.treatment_plan ? "Plan in progress" : "Waiting for admission"}</p>
            }
          >
            <div className="space-y-4">
              <PathwayActions caseData={caseData} onUpdate={loadCase} user={user} onRequestTheatre={() => setShowTheatreChecklist(true)} />
              <KardexTab caseData={caseData} onUpdate={loadCase} user={user} />
              <JackSafetyPanel caseData={caseData} />
              {!isConservative && <ConsentChecklistTab caseData={caseData} onUpdate={loadCase} user={user} />}
            </div>
          </CollapsibleCard>

          {/* 1. Admitted patient: show inpatient overview (last note + plan); otherwise show clinical proforma */}
          {(isAdmitted || hasAdmissionNote) && !hasNewNursingIssue ? (
            <>
              <CollapsibleCard title="Inpatient Overview" icon={ClipboardCheck} defaultOpen={false}
                collapsedSummary={
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-gray-900">{caseData.patient_name}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">{caseData.diagnosis || caseData.presenting_complaint || "No diagnosis"}</span>
                    {caseData.ward && <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">{caseData.ward}{caseData.bed_number ? ` · Bed ${caseData.bed_number}` : ""}</span>}
                  </div>
                }
              >
                <InpatientOverview caseData={caseData} onAddNote={() => setShowInpatientNote(true)} />
              </CollapsibleCard>
            </>
          ) : (
            <CollapsibleCard
              title={hasNewNursingIssue ? "Clinical Proforma — New Issue" : "Clinical Proforma"}
              icon={Stethoscope}
              open={proformaOpen}
              onOpenChange={setProformaOpen}
              variant={timeSensitiveFlags.length > 0 ? "alert" : "default"}
              badge={timeSensitiveFlags.length > 0 ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-600 border border-red-500/20">
                  {timeSensitiveFlags.length} FLAG{timeSensitiveFlags.length > 1 ? "S" : ""}
                </span>
              ) : null}
              collapsedSummary={
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {timeSensitiveFlags.length > 0 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                      {timeSensitiveFlags.map(f => f.label).join(" · ")}
                    </span>
                  )}
                  {hasAdmissionNote ? (
                    <span className="text-green-600 font-medium">✓ Admission note ready</span>
                  ) : (
                    <span className="text-amber-500 font-medium">{hasExam ? "Exam done" : "Waiting for exam"} {!hasLabs && "· Bloods pending"}</span>
                  )}
                </div>
              }
            >
              <ClerkingTab caseData={caseData} photos={photos} caseId={id} onPhotoAdded={loadCase} onProformaSaved={() => setProformaOpen(false)} />
            </CollapsibleCard>
          )}

          {/* 5. Investigations */}
          <CollapsibleCard title="Investigations" icon={FlaskConical}
            badge={hasLabs ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">BLOODS</span> : null}
            collapsedSummary={
              <p className="text-xs text-gray-500">{hasLabs ? `${caseData.investigation_data.bloods.length} blood panels selected` : "No bloods added yet"}</p>
            }
          >
            <div className="space-y-4">
              <LabsImagingDiscovery caseData={caseData} />
              <ImagingReports caseData={caseData} photos={photos} caseId={id} onPhotoAdded={loadCase} />
              <ReviewInvestigations caseData={caseData} onUpdate={loadCase} canEdit={true} />
            </div>
          </CollapsibleCard>

          {/* 7. Discharge */}
          <CollapsibleCard title="Discharge" icon={FileCheck}
            badge={caseData.status === "discharged" ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-600 border border-green-200">DONE</span> : null}
            collapsedSummary={<p className="text-xs text-gray-400">{caseData.status === "discharged" ? "Patient discharged" : "Not yet discharged"}</p>}
          >
            <DischargeTab caseData={caseData} onUpdate={loadCase} user={user} />
          </CollapsibleCard>

          {/* Patient Record & Timeline — unified, minimized */}
          <CollapsibleCard title="Patient Record & Timeline" icon={FileText} defaultOpen={false}
            collapsedSummary={<p className="text-xs text-gray-400">Tap to view full record & notes</p>}
          >
            <CaseRecordTimeline caseData={caseData} />
          </CollapsibleCard>
          </div>
      </div>

      {showPrintNote && <PrintPlanNote caseData={caseData} onClose={() => setShowPrintNote(false)} onUpdate={loadCase} />}
      {showExport && <ExportShareDialog caseData={caseData} onClose={() => setShowExport(false)} />}
      {showDrugCalc && <DrugCalculatorPanel caseData={caseData} onClose={() => setShowDrugCalc(false)} />}
      {showProforma && <ProformaModal caseData={caseData} caseId={id} onClose={() => setShowProforma(false)} onUpdate={loadCase} />}
      {showAdmissionNote && <AdmissionNotePanel caseData={caseData} caseId={id} onClose={() => setShowAdmissionNote(false)} onUpdate={loadCase} />}
      {showInpatientNote && <InpatientNotePanel caseData={caseData} caseId={id} onClose={() => setShowInpatientNote(false)} onUpdate={loadCase} />}
      {showOperativeNote && <OperativeNotePanel caseData={caseData} caseId={id} onClose={() => setShowOperativeNote(false)} onUpdate={loadCase} />}
      {showPatientInfo && <PatientInfoEditor caseData={caseData} onClose={() => setShowPatientInfo(false)} onUpdate={loadCase} />}
      {showTheatreChecklist && <TheatreChecklistPanel caseData={caseData} user={user} onClose={() => setShowTheatreChecklist(false)} onUpdate={loadCase} />}
    </div>
  );
}

function TreatmentPathwayBadge({ caseData }) {
  const { pre_op_status, pod, procedure_date } = caseData;

  if (pre_op_status === "not_applicable") {
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">CONSERVATIVE</span>;
  }
  if (pre_op_status === "listed") {
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">PRE-OP · LISTED</span>;
  }
  if (pre_op_status === "in_theatre") {
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">IN THEATRE</span>;
  }
  if (pre_op_status === "post_op") {
    let day = pod;
    if (!day && procedure_date) {
      const diff = Math.floor((Date.now() - new Date(procedure_date).getTime()) / 86400000);
      day = diff + 1;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">POD {day || 0}</span>;
  }
  return null;
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

function Field({ label, value, capitalize }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-sm text-gray-900 mt-0.5 whitespace-pre-wrap ${capitalize ? "capitalize" : ""}`}>{value}</p>
    </div>
  );
}

function extractClinicalHistory(caseData) {
  const history = [];
  const pmhItems = [];
  const medItems = [];

  if (caseData.proforma_data) {
    for (const [key, entry] of Object.entries(caseData.proforma_data)) {
      if (entry.answer === "yes") {
        if (key.includes("Diabetic")) pmhItems.push("Diabetes Mellitus");
        if (key.includes("Smoker")) pmhItems.push("Smoker");
        if (key.includes("Osteoporosis")) pmhItems.push("Osteoporosis");
        if (key.toLowerCase().includes("anticoagul")) pmhItems.push("On Anticoagulants");
      }
    }
  }

  if (caseData.kardex_data?.medications?.length > 0) {
    caseData.kardex_data.medications.forEach(m => {
      medItems.push(`${m.drug} ${m.dose} ${m.route} ${m.frequency}`);
    });
  }

  if (pmhItems.length > 0) history.push({ label: "Past Medical History", value: pmhItems.join(", ") });
  if (medItems.length > 0) history.push({ label: "Current Medications", value: medItems.join("\n") });
  if (caseData.iv_fluid_plan) history.push({ label: "IV Fluid Plan", value: caseData.iv_fluid_plan });

  return history;
}

// Drug class → color mapping for color-coded kardex
const DRUG_CLASS_COLORS = {
  antibiotic: { label: "Antibiotic", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  anticoagulant: { label: "Anticoagulant", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  analgesic: { label: "Analgesic", bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
  ppi: { label: "PPI/GI", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  vte: { label: "VTE Prophylaxis", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  insulin: { label: "Insulin/Diabetes", bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500" },
  cardiac: { label: "Cardiac", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
  fluid: { label: "IV Fluid", bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", dot: "bg-cyan-500" },
  other: { label: "Other", bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", dot: "bg-gray-500" },
};

function classifyDrug(drugName, indication) {
  const text = `${drugName || ""} ${indication || ""}`.toLowerCase();
  if (/(amox|cefazolin|augmentin|fluclox|vancomycin|gentamicin|co-amox|metronidazole|clindamycin|piperacillin|meropenem|linezolid|teicoplanin|antibiot)/.test(text)) return "antibiotic";
  if (/(warfarin|apixaban|rivaroxaban|dabigatran|edoxaban|enoxaparin|clexane|heparin|lmwh|clopidogrel|aspirin|anticoagul|antiplatelet|plavix)/.test(text)) return "anticoagulant";
  if (/(paracet|morph|oxycod|fentanyl|tramad|codeine|ibuprofen|diclofenac|naproxen|ketamine|gabapen|pregab|analges|pain|opioid)/.test(text)) return "analgesic";
  if (/(omeprazol|pantoprazol|lansoprazol|esomep|ppi|gastro|lactulos|ondansetron|antiemetic)/.test(text)) return "ppi";
  if (/(vte|prophyla|ted|enox.*40|clexane.*40|lmwh.*prophy)/.test(text)) return "vte";
  if (/(insulin|metformin|glargine|novorapid|humalog|lantus|diabet)/.test(text)) return "insulin";
  if (/(bisoprolol|amlodipine|ramipril|lisinopril|losartan|atenolol|furosemide|spironolactone|digoxin|cardiac|bp|hypertens)/.test(text)) return "cardiac";
  if (/(sodium|hartmann|ringer|saline|dextrose|iv fluid|infusion|nacl)/.test(text)) return "fluid";
  return "other";
}

function ColorCodedKardex({ caseData, kardex, onPrint }) {
  const meds = kardex.medications || [];
  const classes = [...new Set(meds.map(m => classifyDrug(m.drug, m.indication)))];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 text-sm">Inpatient Kardex — {caseData.patient_name}</h3>
        <button onClick={onPrint} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200" title="Download Kardex PDF">
          <Printer className="w-4 h-4" />
        </button>
      </div>

      {/* Drug class legend */}
      <div className="flex flex-wrap gap-1.5 px-4 py-2 bg-gray-50 border-b border-gray-200">
        {classes.map(cls => {
          const c = DRUG_CLASS_COLORS[cls];
          return (
            <span key={cls} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${c.bg} ${c.text} border ${c.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
              {c.label}
            </span>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs text-gray-500">
              <th className="text-left px-4 py-2 font-medium">Drug</th>
              <th className="text-left px-4 py-2 font-medium">Dose</th>
              <th className="text-left px-4 py-2 font-medium">Route</th>
              <th className="text-left px-4 py-2 font-medium">Frequency</th>
              <th className="text-left px-4 py-2 font-medium">Indication</th>
              <th className="text-left px-4 py-2 font-medium">Class</th>
            </tr>
          </thead>
          <tbody>
            {meds.map((med, i) => {
              const cls = classifyDrug(med.drug, med.indication);
              const c = DRUG_CLASS_COLORS[cls];
              return (
                <tr key={i} className={`border-b border-gray-100 ${c.bg}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{med.drug}</td>
                  <td className="px-4 py-3 text-gray-900">{med.dose}</td>
                  <td className="px-4 py-3 text-gray-900">{med.route}</td>
                  <td className="px-4 py-3 text-gray-900">{med.frequency}</td>
                  <td className="px-4 py-3 text-gray-500">{med.indication}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${c.bg} ${c.text} border ${c.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                      {c.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
    } catch { alert("Failed to upload image."); }
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
      await base44.entities.CaseNote.create({
        case_id: caseData.id,
        patient_id: caseData.patient_id || "",
        note_type: "admission",
        content: `Patient admitted.\n\nTreatment Plan:\n${result.treatment_plan || "See kardex."}\n\nIV Fluids:\n${result.iv_fluids || "N/A"}`,
        author_name: user?.full_name || "Unknown",
        author_id: user?.id || "",
        author_grade: user?.clinical_grade || "nchd",
        author_imc: user?.imc_number || "",
        is_locked: true,
      });
      onUpdate();
    } catch { alert("Failed to generate kardex."); }
    finally { setGenerating(false); }
  };

  return (
    <div className="space-y-3">
      {!kardex && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-2">Generate Inpatient Kardex</h3>
          <p className="text-sm text-gray-500 mb-3">Upload a photo of medications or generate a baseline kardex.</p>
          <textarea value={comorbidities} onChange={(e) => setComorbidities(e.target.value)} rows={2}
            placeholder="e.g. T2DM, HTN, AF on warfarin, CKD stage 3"
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 resize-none mb-3" />
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} />
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200">
              <Camera className="w-4 h-4" /> Upload Meds
            </button>
            {medUrl && <img src={medUrl} alt="meds" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />}
            <button onClick={handleGenerate} disabled={generating} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pill className="w-4 h-4" />} Generate Kardex
            </button>
          </div>
        </div>
      )}

      {kardex && (
        <>
          <BeeMonitor caseData={caseData} kardex={kardex} />

          {kardex.alerts?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="font-semibold text-red-600 text-sm">Contraindication Alerts</span>
              </div>
              <ul className="space-y-0.5">
                {kardex.alerts.map((a, i) => <li key={i} className="text-sm text-red-600">• {a}</li>)}
              </ul>
            </div>
          )}

          <ColorCodedKardex caseData={caseData} kardex={kardex} onPrint={() => downloadKardexPDF(caseData, kardex)} />

          {/* VTE Prophylaxis & Bridging Calculator */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold text-gray-900 text-sm">VTE Prophylaxis & Bridging</h3>
              <span className="ml-auto text-[10px] font-bold text-gray-400 uppercase">Auto-calculated</span>
            </div>
            <VTEProphylaxisPanel caseData={caseData} kardex={kardex} user={user} onUpdate={onUpdate} />
          </div>

          {kardex.iv_fluids && (
            <div>
              <p className="text-sm text-gray-500 mb-1">IV Fluid Plan</p>
              <div className="bg-card border border-border rounded-lg p-3">
                <FormattedAdmissionNote note={kardex.iv_fluids} />
              </div>
            </div>
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
  const [transferSpecialty, setTransferSpecialty] = useState("");

  const handleGenerate = async (type) => {
    setGenerating(true);
    try {
      let pathwayValue = "no_followup";
      if (type === "opd") pathwayValue = "opd_followup";
      if (type === "tci") pathwayValue = "tci";

      const result = await generateDischargeDocuments(caseData.presenting_complaint, caseData.referral_summary, pathwayValue, caseData.patient_name);
      setDocs(result);

      const updates = {
        discharge_pathway: pathwayValue,
        gp_letter: result.gp_letter,
        patient_education_sheet: result.patient_education_sheet,
        status: "discharged",
        note_author_name: user?.full_name || "Unknown",
        note_author_grade: user?.clinical_grade || "nchd",
        note_author_imc: user?.imc_number || "",
        note_locked_at: new Date().toISOString(),
      };

      if (type === "transfer") {
        updates.accepting_specialty = transferSpecialty;
      }

      await base44.entities.CaseFile.update(caseData.id, updates);
      setPathway(pathwayValue);
      onUpdate();
    } catch { alert("Failed to generate discharge documents."); }
    finally { setGenerating(false); }
  };

  const handleEmail = async (type) => {
    const email = prompt(`Enter ${type === "patient" ? "patient" : "GP"} email address:`);
    if (!email) return;
    setSending(true);
    try {
      const body = type === "patient" ? docs.patient_education_sheet : docs.gp_letter;
      await base44.integrations.Core.SendEmail({ to: email, subject: `HIVE — ${caseData.patient_name} — Discharge Summary`, body });
      alert("Email sent successfully.");
    } catch { alert("Failed to send email."); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-4">
      {pathway === "not_discharged" && !docs.gp_letter && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Select a discharge pathway:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DischargeOption icon={FileCheck} title="Discharge Home" desc="GP letter, patient education, safety net"
              onClick={() => handleGenerate("home")} disabled={generating} />
            <DischargeOption icon={Calendar} title="TCI — To Come In" desc="Elective admission scheduled"
              onClick={() => handleGenerate("tci")} disabled={generating} />
            <DischargeOption icon={Share2} title="To Other Specialty" desc="Handover summary to another team"
              onClick={() => {
                const s = prompt("Enter accepting specialty/team:");
                if (s) { setTransferSpecialty(s); handleGenerate("transfer"); }
              }} disabled={generating} />
            <DischargeOption icon={FileCheck} title="OPD Follow-up" desc="GP letter with follow-up plan"
              onClick={() => handleGenerate("opd")} disabled={generating} />
          </div>
          {generating && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          )}
        </div>
      )}

      {docs.gp_letter && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AIBadge />
              <p className="text-sm text-gray-500">GP Discharge Letter</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <FormattedAdmissionNote note={docs.gp_letter} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <AIBadge />
              <p className="text-sm text-gray-500">Patient Education Sheet</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <FormattedAdmissionNote note={docs.patient_education_sheet} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleEmail("patient")} disabled={sending}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200">
              <Send className="w-4 h-4" /> Email Patient
            </button>
            <button onClick={() => handleEmail("gp")} disabled={sending}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200">
              <Send className="w-4 h-4" /> Email GP
            </button>
            <button onClick={() => downloadDischargeSummaryPDF(caseData, docs)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200">
              <Printer className="w-4 h-4" /> Print PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function DischargeOption({ icon: Icon, title, desc, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex flex-col items-start p-4 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors text-left disabled:opacity-50">
      <Icon className="w-5 h-5 text-gray-600 mb-2" />
      <span className="font-semibold text-sm text-gray-900">{title}</span>
      <span className="text-xs text-gray-500 mt-0.5">{desc}</span>
    </button>
  );
}

function ReviewTab({ caseData, onUpdate, user }) {
  const [notes, setNotes] = useState(caseData.review_notes || "");
  const [plan, setPlan] = useState(caseData.treatment_plan || "");
  const [signing, setSigning] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [suggestingPlan, setSuggestingPlan] = useState(false);

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
    } catch { alert("Failed to save plan."); }
    finally { setSavingPlan(false); }
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
    } catch { alert("Failed to generate plan."); }
    finally { setSuggestingPlan(false); }
  };

  const handlePrintPDF = () => { downloadCallNotePDF({ ...caseData, treatment_plan: plan }); };

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
    } catch { alert("Failed to countersign."); }
    finally { setSigning(false); }
  };

  return (
    <div className="space-y-4">
      {/* Management Plan */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-gray-500">Management Plan</p>
          <div className="flex items-center gap-2">
            <AIBadge />
            <button onClick={handleSuggestPlan} disabled={suggestingPlan}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 disabled:opacity-40">
              {suggestingPlan ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              AI Suggest
            </button>
            <button onClick={handleSavePlan} disabled={savingPlan}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-40">
              {savingPlan ? <Loader2 className="w-3 h-3 animate-spin" /> : <ClipboardCheck className="w-3 h-3" />}
              Save
            </button>
          </div>
        </div>
        <textarea value={plan} onChange={(e) => setPlan(e.target.value)} rows={6}
          placeholder="Edit the management plan, or click AI Suggest..."
          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 resize-none" />
      </div>

      {/* Review Notes */}
      <div>
        <p className="text-sm text-gray-500 mb-1">Review Notes</p>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
          placeholder="Add review notes, annotations, or changes needed..."
          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 resize-none" />
      </div>

      {caseData.review_status === "countersigned" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-700">Countersigned</p>
            <p className="text-xs text-gray-500">
              By Dr. {user?.full_name} · IMC: {caseData.reviewer_imc || "N/A"}
              {caseData.countersigned_at && ` · ${new Date(caseData.countersigned_at).toLocaleString("en-GB")}`}
            </p>
          </div>
        </div>
      )}

      {canCountersign && caseData.review_status !== "countersigned" && (
        <div className="flex gap-2">
          <button onClick={handleCountersign} disabled={signing}
            className="flex-1 px-4 py-3 rounded-lg bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 flex items-center justify-center gap-2">
            {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Countersign (IMC: {user?.imc_number || "N/A"})
          </button>
          <button onClick={handlePrintPDF}
            className="px-4 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 flex items-center justify-center gap-2">
            <Printer className="w-4 h-4" /> Print PDF
          </button>
        </div>
      )}

      {caseData.review_status === "countersigned" && (
        <button onClick={handlePrintPDF}
          className="w-full px-4 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 flex items-center justify-center gap-2">
          <Printer className="w-4 h-4" /> Print Signed Note (PDF)
        </button>
      )}
    </div>
  );
}