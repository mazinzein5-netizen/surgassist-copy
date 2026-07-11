import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { generateKardex, generateDischargeDocuments, suggestManagementPlan, uploadFile } from "@/lib/hiveApi";

import { ArrowLeft, Loader2, FileText, Pill, FileCheck, Send, Printer, Stethoscope, ClipboardCheck, AlertTriangle, CheckCircle2, ShieldCheck, FlaskConical, Download, Calculator, MessageSquare, User, Sparkles, Share2, Camera } from "lucide-react";
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
import ChronologicalNotes from "@/components/ChronologicalNotes";
import FormattedAdmissionNote from "@/components/FormattedAdmissionNote";
import PrintPlanNote from "@/components/PrintPlanNote";
import CollapsibleCard from "@/components/CollapsibleCard";
import WorkflowStepper from "@/components/WorkflowStepper";
import TriageChat from "@/components/TriageChat";
import PathwayActions from "@/components/PathwayActions";
import StatusPill from "@/components/StatusPill";
import ProformaModal from "@/components/ProformaModal";
import AdmissionNotePanel from "@/components/AdmissionNotePanel";
import InpatientNotePanel from "@/components/InpatientNotePanel";
import OperativeNotePanel from "@/components/OperativeNotePanel";
import { formatTimestamp } from "@/lib/workflow";
import AIBadge from "@/components/AIBadge";

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

  const clinicalHistory = extractClinicalHistory(caseData);

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
              <h1 className="text-lg md:text-xl font-bold text-gray-900">{caseData.patient_name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                {caseData.patient_mrn && <span>MRN: {caseData.patient_mrn}</span>}
                {caseData.patient_dob && <span>DOB: {new Date(caseData.patient_dob).toLocaleDateString("en-GB")}</span>}
                <span className="capitalize">{caseData.department?.replace("_", " ")}</span>
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
            <button onClick={() => setShowOperativeNote(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors">
              <FileText className="w-3.5 h-3.5" /> Operative Note
            </button>
            <BloodsCameraButton caseData={caseData} onUpdate={loadCase} />
          </div>
        </div>
      </div>

      {/* Content — single scroll with collapsible sections */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* 1. AI Triage Chat — always open */}
          <CollapsibleCard title="AI Triage Chat" icon={MessageSquare} defaultOpen={true}>
            <TriageChat caseId={id} caseData={caseData} />
          </CollapsibleCard>

          {/* 2. Patient Info */}
          <CollapsibleCard title="Patient Info" icon={User}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <InfoItem label="Name" value={caseData.patient_name} />
              <InfoItem label="DOB" value={caseData.patient_dob ? new Date(caseData.patient_dob).toLocaleDateString("en-GB") : "—"} />
              <InfoItem label="MRN" value={caseData.patient_mrn || "—"} />
              <InfoItem label="Gender" value={caseData.patient_gender ? caseData.patient_gender.charAt(0).toUpperCase() + caseData.patient_gender.slice(1) : "—"} />
              <InfoItem label="Hospital" value={caseData.hospital || "—"} />
              <InfoItem label="Ward" value={caseData.ward || "—"} />
              <InfoItem label="Bed" value={caseData.bed_number || "—"} />
              <InfoItem label="Consultant" value={caseData.consultant_name || "—"} />
              <InfoItem label="Specialty" value={caseData.specialty || caseData.accepting_specialty || "—"} />
            </div>
          </CollapsibleCard>

          {/* 3. Referral Summary */}
          <CollapsibleCard title="Referral Summary" icon={FileText}>
            <div className="space-y-3">
              {caseData.presenting_complaint && (
                <Field label="Presenting Complaint" value={caseData.presenting_complaint} />
              )}
              {caseData.mechanism_of_injury && (
                <Field label="Mechanism of Injury" value={caseData.mechanism_of_injury} />
              )}
              {caseData.referral_summary && (
                <Field label="Referral Summary" value={caseData.referral_summary} />
              )}
              {caseData.referral_mode && (
                <Field label="Referral Mode" value={caseData.referral_mode} capitalize />
              )}
              {caseData.referrer_name && (
                <Field label="Referrer" value={`${caseData.referrer_name}${caseData.referrer_grade ? ` · ${caseData.referrer_grade}` : ""}${caseData.referrer_department ? ` · ${caseData.referrer_department}` : ""}`} />
              )}
              {caseData.referring_team && (
                <Field label="Referring Team" value={caseData.referring_team} />
              )}

              {/* Triage decision */}
              {caseData.triage_decision && caseData.triage_decision !== "pending" && (
                <div className="pt-3 border-t border-gray-100">
                  <StatusPill caseData={caseData} />
                </div>
              )}
              {caseData.triage_reasoning && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Reasoning</p>
                  <ReasoningBullets text={caseData.triage_reasoning} />
                </div>
              )}
              {caseData.triage_guideline && (
                <Field label="Guideline Applied" value={caseData.triage_guideline} />
              )}
              {caseData.pre_clerking_guidance && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AIBadge />
                    <p className="text-sm text-gray-500">Pre-Clerking Guidance</p>
                  </div>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{caseData.pre_clerking_guidance}</p>
                </div>
              )}
              {caseData.admission_note && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Admission Note</p>
                  <FormattedAdmissionNote note={caseData.admission_note} />
                </div>
              )}
            </div>
          </CollapsibleCard>

          {/* 4. Clinical Proforma */}
          <CollapsibleCard title="Clinical Proforma" icon={Stethoscope}>
            <ClerkingTab caseData={caseData} photos={photos} caseId={id} onPhotoAdded={loadCase} />
          </CollapsibleCard>

          {/* 5. Investigations */}
          <CollapsibleCard title="Investigations" icon={FlaskConical}>
            <div className="space-y-4">
              <LabsImagingDiscovery caseData={caseData} />
              <ImagingReports caseData={caseData} photos={photos} caseId={id} onPhotoAdded={loadCase} />
              <ReviewInvestigations caseData={caseData} onUpdate={loadCase} canEdit={true} />
            </div>
          </CollapsibleCard>

          {/* 6. Admission & Plan */}
          <CollapsibleCard title="Admission & Plan" icon={ClipboardCheck}>
            <div className="space-y-4">
              <PathwayActions caseData={caseData} onUpdate={loadCase} user={user} />
              <KardexTab caseData={caseData} onUpdate={loadCase} user={user} />
              <JackSafetyPanel caseData={caseData} />
              <ConsentChecklistTab caseData={caseData} onUpdate={loadCase} user={user} />
              <ReviewTab caseData={caseData} onUpdate={loadCase} user={user} />
            </div>
          </CollapsibleCard>

          {/* 7. Discharge */}
          <CollapsibleCard title="Discharge" icon={FileCheck}>
            <DischargeTab caseData={caseData} onUpdate={loadCase} user={user} />
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
    </div>
  );
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

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 text-sm">Inpatient Kardex — {caseData.patient_name}</h3>
              <button onClick={() => downloadKardexPDF(caseData, kardex)} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200" title="Download Kardex PDF">
                <Printer className="w-4 h-4" />
              </button>
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
                  </tr>
                </thead>
                <tbody>
                  {kardex.medications?.map((med, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-900">{med.drug}</td>
                      <td className="px-4 py-3 text-gray-900">{med.dose}</td>
                      <td className="px-4 py-3 text-gray-900">{med.route}</td>
                      <td className="px-4 py-3 text-gray-900">{med.frequency}</td>
                      <td className="px-4 py-3 text-gray-500">{med.indication}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {kardex.iv_fluids && (
            <div>
              <p className="text-sm text-gray-500 mb-1">IV Fluid Plan</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{kardex.iv_fluids}</p>
            </div>
          )}
          {kardex.treatment_plan && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Treatment Plan</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{kardex.treatment_plan}</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <DischargeOption icon={FileCheck} title="Discharge Home" desc="GP letter, patient education, safety net"
              onClick={() => handleGenerate("home")} disabled={generating} />
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
            <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans bg-gray-50 border border-gray-200 rounded-lg p-3">{docs.gp_letter}</pre>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <AIBadge />
              <p className="text-sm text-gray-500">Patient Education Sheet</p>
            </div>
            <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans bg-gray-50 border border-gray-200 rounded-lg p-3">{docs.patient_education_sheet}</pre>
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
      <ChronologicalNotes caseData={caseData} />

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