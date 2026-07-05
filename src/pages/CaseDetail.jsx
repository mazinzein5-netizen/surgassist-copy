import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { generateClerkingProforma, generateKardex, generateDischargeDocuments, generateConsentChecklist, generateInvestigationPlan, generatePreClerkingGuidance, generateAdmissionNote, checkClerkingCompleteness, uploadFile } from "@/lib/hiveApi";
import { exportTextToPDF } from "@/lib/pdfExport";
import AIBadge from "@/components/AIBadge";
import HexBadge from "@/components/HexBadge";
import { ExamGuideSection, DermatomeMap, MyotomeGuide, ReflexGuide, AbdominalExamGuide, VascularExamGuide, WoundAssessmentGuide } from "@/components/ExamGuides";
import { ArrowLeft, Loader2, Camera, FileText, Pill, FileCheck, Send, Printer, Stethoscope, Activity, ClipboardCheck, Eye, Hand, AlertTriangle, CheckCircle2, Edit3, ShieldCheck, Download, RefreshCw, ListChecks } from "lucide-react";
import ConsentChecklistTab from "@/components/ConsentChecklistTab";
import InvestigationPrompts from "@/components/InvestigationPrompts";

const TABS = [
  { id: "summary", label: "Summary", icon: FileText },
  { id: "clerking", label: "Clerking", icon: Stethoscope },
  { id: "kardex", label: "Kardex", icon: Pill },
  { id: "discharge", label: "Discharge", icon: FileCheck },
  { id: "consent", label: "Consent", icon: ShieldCheck },
  { id: "review", label: "Review", icon: ClipboardCheck },
];

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [photos, setPhotos] = useState([]);

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
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border px-4 md:px-8 bg-card/30">
        <div className="max-w-5xl mx-auto flex gap-1 overflow-x-auto scrollbar-thin">
          {TABS.map(tab => {
            const Icon = tab.icon;
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
          {activeTab === "kardex" && <KardexTab caseData={caseData} onUpdate={loadCase} />}
          {activeTab === "discharge" && <DischargeTab caseData={caseData} onUpdate={loadCase} />}
          {activeTab === "consent" && <ConsentChecklistTab caseData={caseData} onUpdate={loadCase} user={user} />}
          {activeTab === "review" && <ReviewTab caseData={caseData} onUpdate={loadCase} user={user} />}
        </div>
      </div>
    </div>
  );
}

function SummaryTab({ caseData }) {
  return (
    <div className="space-y-4">
      <Section title="Referral Summary" icon={FileText}>
        <p className="text-sm text-foreground whitespace-pre-wrap">{caseData.referral_summary || "No referral summary recorded."}</p>
        {caseData.referral_mode && (
          <p className="text-xs text-muted-foreground mt-2">Input mode: <span className="capitalize">{caseData.referral_mode}</span></p>
        )}
      </Section>

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

function ClerkingTab({ caseData, photos, caseId, onPhotoAdded }) {
  const [proforma, setProforma] = useState(caseData.clerking_data || null);
  const [generating, setGenerating] = useState(false);
  const [photoType, setPhotoType] = useState("wound");
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completeness, setCompleteness] = useState(null);
  const [checking, setChecking] = useState(false);
  const [admissionNote, setAdmissionNote] = useState(caseData.admission_note || "");
  const [generatingNote, setGeneratingNote] = useState(false);
  const [sending, setSending] = useState(false);

  // Initialize field values from existing proforma
  const initFieldValues = (pf) => {
    const vals = {};
    pf?.sections?.forEach((s, si) => {
      s.fields?.forEach((f, fi) => {
        vals[`${si}-${fi}`] = f.value ?? f.pre_filled ?? "";
      });
    });
    return vals;
  };
  const [fieldValues, setFieldValues] = useState(() => initFieldValues(caseData.clerking_data));

  const handleFieldChange = (key, value) => {
    setFieldValues(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateProforma = async () => {
    setGenerating(true);
    try {
      const result = await generateClerkingProforma(caseData.presenting_complaint || caseData.referral_summary, caseData.referral_summary);
      setProforma(result);
      setFieldValues(initFieldValues(result));
      await base44.entities.CaseFile.update(caseId, { clerking_data: result, status: "clerking" });
      onPhotoAdded();
    } catch (err) {
      alert("Failed to generate proforma. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Save field values into proforma structure + persist to entity
  const saveClerking = async () => {
    setSaving(true);
    try {
      const updated = { ...proforma };
      updated.sections = updated.sections.map((section, si) => ({
        ...section,
        fields: section.fields?.map((field, fi) => ({
          ...field,
          value: fieldValues[`${si}-${fi}`] ?? field.pre_filled ?? "",
        })),
      }));
      setProforma(updated);
      await base44.entities.CaseFile.update(caseId, { clerking_data: updated });
      onPhotoAdded();
      return updated;
    } catch (err) {
      alert("Failed to save clerking data.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Save + check completeness + auto-generate admission note
  const handleSaveAndCheck = async () => {
    const savedProforma = await saveClerking();
    if (!savedProforma) return;

    // Run completeness check
    setChecking(true);
    try {
      const result = await checkClerkingCompleteness(savedProforma, caseData.presenting_complaint || caseData.referral_summary, caseData.referral_summary);
      setCompleteness(result);
    } catch {
      alert("Failed to check completeness.");
    } finally {
      setChecking(false);
    }

    // Auto-generate admission note from current clerking data
    setGeneratingNote(true);
    try {
      const updatedCase = { ...caseData, clerking_data: savedProforma };
      const result = await generateAdmissionNote(updatedCase, [], [], "");
      const note = typeof result === "string" ? result : (result.admission_note || "");
      setAdmissionNote(note);
      await base44.entities.CaseFile.update(caseId, { admission_note: note });
      onPhotoAdded();
    } catch {
      // Silently fail — note generation is secondary to the save
    } finally {
      setGeneratingNote(false);
    }
  };

  // Re-generate admission note with latest info (keeps input open for updates)
  const handleRegenerateNote = async () => {
    const savedProforma = await saveClerking();
    if (!savedProforma) return;
    setGeneratingNote(true);
    try {
      const updatedCase = { ...caseData, clerking_data: savedProforma };
      const result = await generateAdmissionNote(updatedCase, [], [], "");
      const note = typeof result === "string" ? result : (result.admission_note || "");
      setAdmissionNote(note);
      await base44.entities.CaseFile.update(caseId, { admission_note: note });
      onPhotoAdded();
    } catch {
      alert("Failed to generate admission note.");
    } finally {
      setGeneratingNote(false);
    }
  };

  const handleDownloadPDF = () => {
    exportTextToPDF("Admission Note", admissionNote, caseData.patient_name);
  };

  const handleEmailNote = async () => {
    const email = prompt("Enter email address to send the admission note:");
    if (!email) return;
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `HIVE — Admission Note — ${caseData.patient_name}`,
        body: admissionNote,
      });
      alert("Email sent successfully.");
    } catch {
      alert("Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadResult = await uploadFile(file);
      await base44.entities.ClinicalPhoto.create({
        case_id: caseId,
        photo_type: photoType,
        photo_url: uploadResult.file_url,
        caption: "",
      });
      onPhotoAdded();
    } catch (err) {
      alert("Failed to upload photo.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Generate Proforma */}
      {!proforma && (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <Stethoscope className="w-10 h-10 text-hive-gold mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Generate an AI-tailored clerking proforma for this presentation.</p>
          <AIBadge />
          <button
            onClick={handleGenerateProforma}
            disabled={generating}
            className="mt-3 px-4 py-2.5 rounded-lg bg-hive-gold text-hive-gold-foreground font-medium text-sm hover:bg-hive-gold/90 transition-colors flex items-center gap-2 mx-auto"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stethoscope className="w-4 h-4" />}
            Generate Clerking Proforma
          </button>
        </div>
      )}

      {/* Proforma */}
      {proforma?.sections && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Clerking Proforma</h3>
            <AIBadge />
          </div>
          {proforma.sections.map((section, si) => (
            <Section key={si} title={section.title} icon={FileText}>
              <div className="space-y-3">
                {section.fields?.map((field, fi) => {
                  const key = `${si}-${fi}`;
                  const val = fieldValues[key] ?? "";
                  const isPrefilled = !val && field.pre_filled;
                  return (
                    <div key={fi}>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        {field.label}{field.required && <span className="text-destructive ml-0.5">*</span>}
                      </label>
                      <textarea
                        rows={2}
                        value={val}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        placeholder={field.pre_filled ? field.pre_filled : `Enter ${field.label.toLowerCase()}...`}
                        className={`w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-hive-gold/50 resize-none ${isPrefilled ? "italic text-muted-foreground" : "text-foreground placeholder:text-muted-foreground"}`}
                      />
                    </div>
                  );
                })}
              </div>
            </Section>
          ))}
          {proforma.auto_summary && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
              <p className="text-xs font-semibold text-warning uppercase mb-1">Auto-Certified Statement</p>
              <p className="text-sm text-foreground italic whitespace-pre-wrap">{proforma.auto_summary}</p>
            </div>
          )}

          {/* Save & Check button */}
          <button
            onClick={handleSaveAndCheck}
            disabled={saving || checking || generatingNote}
            className="w-full px-4 py-3 rounded-lg bg-hive-gold text-hive-gold-foreground font-semibold text-sm hover:bg-hive-gold/90 flex items-center justify-center gap-2"
          >
            {saving || checking || generatingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListChecks className="w-4 h-4" />}
            Save, Check Completeness & Generate Admission Note
          </button>
        </div>
      )}

      {/* Completeness Check Results */}
      {completeness && (
        <div className={`bg-card border-2 rounded-xl p-4 ${completeness.is_complete ? "border-success/30" : "border-warning/30"}`}>
          <div className="flex items-center gap-2 mb-3">
            {completeness.is_complete ? <CheckCircle2 className="w-4 h-4 text-success" /> : <AlertTriangle className="w-4 h-4 text-warning" />}
            <h4 className="font-bold text-foreground text-sm">
              {completeness.is_complete ? "Clerking Complete" : "Missing Information"}
            </h4>
            <AIBadge />
          </div>
          {completeness.missing_items?.length > 0 && (
            <ul className="space-y-1 mb-3">
              {completeness.missing_items.map((item, i) => (
                <li key={i} className="text-sm text-warning flex items-start gap-2">
                  <span className="text-warning mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
          {completeness.standards_note && (
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{completeness.standards_note}</p>
          )}
        </div>
      )}

      {/* Admission Note */}
      {admissionNote && (
        <div className="bg-card border-2 border-hive-gold/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-hive-gold" />
              <h4 className="font-bold text-foreground text-sm">Admission Note with Plan</h4>
            </div>
            <div className="flex items-center gap-2">
              <AIBadge />
              <button
                onClick={handleRegenerateNote}
                disabled={generatingNote}
                title="Re-generate with latest info"
                className="p-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80"
              >
                {generatingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </button>
              <button onClick={() => window.print()} title="Print" className="p-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80">
                <Printer className="w-4 h-4" />
              </button>
              <button onClick={handleDownloadPDF} title="Download PDF" className="p-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={handleEmailNote} disabled={sending} title="Email" className="p-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <pre className="text-sm text-foreground whitespace-pre-wrap font-body">{admissionNote}</pre>
        </div>
      )}

      {/* Exam Guides */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Clinical Examination Guides</h3>
        <p className="text-xs text-muted-foreground">Interactive reference diagrams validated against RCSI curriculum.</p>
        <ExamGuideSection title="Dermatome Map — Sensory Testing" icon={Eye}>
          <DermatomeMap />
        </ExamGuideSection>
        <ExamGuideSection title="Myotome Guide — Motor Testing" icon={Hand}>
          <MyotomeGuide />
        </ExamGuideSection>
        <ExamGuideSection title="Deep Tendon Reflexes" icon={Activity}>
          <ReflexGuide />
        </ExamGuideSection>
        <ExamGuideSection title="Abdominal Examination" icon={Stethoscope}>
          <AbdominalExamGuide />
        </ExamGuideSection>
        <ExamGuideSection title="Vascular Examination" icon={Activity}>
          <VascularExamGuide />
        </ExamGuideSection>
        <ExamGuideSection title="Wound Assessment" icon={AlertTriangle}>
          <WoundAssessmentGuide />
        </ExamGuideSection>
      </div>

      {/* Clinical Photos */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Clinical Photos</h3>
        <div className="flex items-center gap-2">
          <select
            value={photoType}
            onChange={(e) => setPhotoType(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
          >
            <option value="wound">Wound</option>
            <option value="xray">X-Ray</option>
            <option value="ecg">ECG</option>
            <option value="medication_list">Medication List</option>
            <option value="other">Other</option>
          </select>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            Add Photo
          </button>
        </div>
        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map(p => (
              <div key={p.id} className="relative group">
                <img src={p.photo_url} alt={p.photo_type} className="w-full h-32 rounded-lg object-cover border border-border" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm rounded-b-lg px-2 py-1">
                  <span className="text-[10px] text-white capitalize">{p.photo_type.replace("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <InvestigationPrompts caseData={caseData} caseId={caseId} onUpdate={onPhotoAdded} />
    </div>
  );
}

function KardexTab({ caseData, onUpdate }) {
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

function DischargeTab({ caseData, onUpdate }) {
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
          <Section title="GP Discharge Letter" icon={FileText}>
            <AIBadge />
            <pre className="text-sm text-foreground whitespace-pre-wrap mt-2 font-body">{docs.gp_letter}</pre>
          </Section>

          <Section title="Patient Education Sheet" icon={FileCheck}>
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
  const [signing, setSigning] = useState(false);
  const canReview = user?.clinical_grade === "registrar" || user?.clinical_grade === "consultant";

  const handleCountersign = async () => {
    setSigning(true);
    try {
      await base44.entities.CaseFile.update(caseData.id, {
        review_status: "countersigned",
        reviewed_by_id: user?.id,
        reviewer_imc: user?.imc_number || "",
        review_notes: notes,
        countersigned_at: new Date().toISOString(),
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

  return (
    <div className="space-y-4">
      {!canReview && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
          <p className="text-sm text-warning">Only Registrars and Consultants can countersign. You can view the case but cannot approve.</p>
        </div>
      )}

      <Section title="Case Review" icon={ClipboardCheck}>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Triage Decision</p>
            <p className="text-sm text-foreground capitalize">{caseData.triage_decision?.replace("_", " ") || "N/A"}</p>
          </div>
          {caseData.triage_reasoning && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Reasoning</p>
              <p className="text-sm text-foreground">{caseData.triage_reasoning}</p>
            </div>
          )}
          {caseData.investigation_recommendations && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Investigations</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{caseData.investigation_recommendations}</p>
            </div>
          )}
          {caseData.treatment_plan && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Treatment Plan</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{caseData.treatment_plan}</p>
            </div>
          )}
        </div>
      </Section>

      <Section title="Review Notes" icon={Edit3}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Add your review notes, annotations, or changes needed..."
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50 resize-none"
          disabled={!canReview}
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

      {canReview && caseData.review_status !== "countersigned" && (
        <button
          onClick={handleCountersign}
          disabled={signing}
          className="w-full px-4 py-3 rounded-lg bg-hive-gold text-hive-gold-foreground font-semibold text-sm hover:bg-hive-gold/90 flex items-center justify-center gap-2"
        >
          {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
          Countersign with IMC: {user?.imc_number || "N/A"}
        </button>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-4 h-4 text-hive-gold" />}
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}