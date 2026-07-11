import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  ArrowUpCircle, FileText, Pill, ShieldCheck, ClipboardCheck,
  FlaskConical, Camera, CheckCircle2, Clock, Activity, Lock, Stethoscope
} from "lucide-react";

const STATUS_LABELS = {
  referral_intake: "Referral Received",
  triage: "Triage In Progress",
  accepted: "Case Accepted",
  declined: "Case Declined",
  clerking: "Clerking Started",
  investigations: "Investigations Ordered",
  admitted: "Patient Admitted",
  discharge_ready: "Discharge Ready",
  discharged: "Patient Discharged",
  inews_consult: "INEWS Consult Triggered",
};

const STATUS_COLORS = {
  referral_intake: "accent",
  triage: "warning",
  accepted: "success",
  declined: "destructive",
  clerking: "accent",
  investigations: "accent",
  admitted: "success",
  discharge_ready: "warning",
  discharged: "muted",
  inews_consult: "destructive",
};

const GRADE_LABELS = { nchd: "NCHD", sho: "SHO", registrar: "Registrar", consultant: "Consultant" };

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function CaseTimeline({ caseData }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    buildTimeline();
  }, [caseData.id]);

  const buildTimeline = async () => {
    const items = [];

    // 1. Referral created
    if (caseData.created_date) {
      items.push({
        type: "status",
        timestamp: caseData.created_date,
        title: "Referral Received",
        description: caseData.referral_summary
          ? caseData.referral_summary.slice(0, 120) + (caseData.referral_summary.length > 120 ? "…" : "")
          : caseData.presenting_complaint || "New referral created",
        icon: ArrowUpCircle,
        color: "accent",
        meta: caseData.referrer_name ? `by ${caseData.referrer_name}` : null,
      });
    }

    // 2. Triage decision
    if (caseData.triage_decision && caseData.triage_decision !== "pending") {
      items.push({
        type: "status",
        timestamp: caseData.triage_reasoning ? caseData.created_date : caseData.created_date,
        title: STATUS_LABELS.triage || "Triage Decision",
        description: `Decision: ${caseData.triage_decision === "accept" ? "Accept" : caseData.triage_decision === "decline" ? "Decline" : "Needs more info"}`
          + (caseData.accepting_specialty ? ` — ${caseData.accepting_specialty}` : ""),
        icon: ClipboardCheck,
        color: caseData.triage_decision === "accept" ? "success" : caseData.triage_decision === "decline" ? "destructive" : "warning",
        meta: caseData.triage_guideline || null,
      });
    }

    // 3. Status changes — we infer milestones from current data fields
    if (caseData.admission_date) {
      items.push({
        type: "status",
        timestamp: caseData.admission_date,
        title: "Patient Admitted",
        description: caseData.admission_note
          ? caseData.admission_note.slice(0, 120) + (caseData.admission_note.length > 120 ? "…" : "")
          : "Patient admitted to ward",
        icon: Activity,
        color: "success",
        meta: caseData.bed_number ? `Bed ${caseData.bed_number}` : null,
      });
    }

    // 4. Note locked (admission note / kardex)
    if (caseData.note_locked_at) {
      items.push({
        type: "note",
        timestamp: caseData.note_locked_at,
        title: "Clinical Note Locked",
        description: caseData.admission_note
          ? "Admission note locked to patient file"
          : caseData.kardex_data ? "Kardex note locked" : "Note locked to patient file",
        icon: Lock,
        color: "gold",
        meta: caseData.note_author_name
          ? `${caseData.note_author_name} · ${GRADE_LABELS[caseData.note_author_grade] || caseData.note_author_grade || "NCHD"}`
          : null,
      });
    }

    // 5. Kardex generated
    if (caseData.kardex_data) {
      const medCount = caseData.kardex_data.medications?.length || 0;
      items.push({
        type: "note",
        timestamp: caseData.note_locked_at || caseData.admission_date || caseData.created_date,
        title: "Kardex Generated",
        description: medCount > 0 ? `${medCount} medication${medCount > 1 ? "s" : ""} prescribed` : "Inpatient drug chart created",
        icon: Pill,
        color: "gold",
        meta: caseData.iv_fluid_plan ? "IV fluids prescribed" : null,
      });
    }

    // 6. Procedure
    if (caseData.procedure_date) {
      items.push({
        type: "status",
        timestamp: caseData.procedure_date,
        title: caseData.pre_op_status === "post_op" ? "Procedure Completed" : "Procedure Scheduled",
        description: caseData.procedure_name || "Procedure",
        icon: Stethoscope,
        color: caseData.pre_op_status === "post_op" ? "success" : "accent",
        meta: caseData.pod != null ? `POD ${caseData.pod}` : null,
      });
    }

    // 7. Countersign / review
    if (caseData.countersigned_at) {
      items.push({
        type: "review",
        timestamp: caseData.countersigned_at,
        title: "Note Countersigned",
        description: caseData.review_notes
          ? caseData.review_notes.slice(0, 120) + (caseData.review_notes.length > 120 ? "…" : "")
          : "Case formally reviewed and countersigned",
        icon: CheckCircle2,
        color: "success",
        meta: caseData.reviewer_imc ? `IMC: ${caseData.reviewer_imc}` : null,
      });
    }

    // 8. Discharge
    if (caseData.discharge_pathway && caseData.discharge_pathway !== "not_discharged") {
      const ts = caseData.note_locked_at || caseData.updated_date;
      items.push({
        type: "status",
        timestamp: ts,
        title: "Patient Discharged",
        description: caseData.discharge_pathway === "opd_followup" ? "Discharged with OPD follow-up" : "Discharged — safety-net letter",
        icon: CheckCircle2,
        color: "muted",
        meta: caseData.gp_letter ? "GP letter generated" : null,
      });
    }

    // 9. Fetch related entities for richer timeline
    try {
      // Lab results
      const labs = await base44.entities.LabResult.filter({ case_id: caseData.id }, "-collected_at", 50);
      labs.forEach((lab) => {
        items.push({
          type: "lab",
          timestamp: lab.collected_at,
          title: `Lab: ${lab.test_type.toUpperCase()}`,
          description: `${lab.value} ${lab.unit || ""}` + (lab.source === "ocr_ingestion" ? " · scanned" : " · manual"),
          icon: FlaskConical,
          color: "accent",
          meta: lab.patient_mrn || null,
        });
      });

      // Clinical photos
      const photos = await base44.entities.ClinicalPhoto.filter({ case_id: caseData.id });
      photos.forEach((photo) => {
        items.push({
          type: "imaging",
          timestamp: photo.created_date,
          title: `${photo.photo_type === "xray" ? "X-Ray" : photo.photo_type === "wound" ? "Wound Photo" : photo.photo_type === "ecg" ? "ECG" : "Clinical Photo"} Added`,
          description: photo.caption || photo.photo_type,
          icon: Camera,
          color: "accent",
          meta: null,
        });
      });

      // Review logs
      const logs = await base44.entities.ReviewLog.filter({ case_id: caseData.id });
      logs.forEach((log) => {
        items.push({
          type: "review",
          timestamp: log.created_date,
          title: log.action === "countersigned" ? "Countersigned" : log.action === "edited" ? "Note Edited" : log.action === "annotated" ? "Annotated" : "Case Viewed",
          description: log.notes || `${log.action} by ${log.reviewer_name}`,
          icon: log.action === "countersigned" ? CheckCircle2 : ClipboardCheck,
          color: log.action === "countersigned" ? "success" : "accent",
          meta: log.reviewer_name ? `${log.reviewer_name} · ${GRADE_LABELS[log.reviewer_grade] || log.reviewer_grade || "NCHD"}` : null,
        });
      });

      // Chat messages (referral conversation)
      const msgs = await base44.entities.ChatMessage.filter({ case_id: caseData.id }, "-created_date", 30);
      msgs.forEach((msg) => {
        items.push({
          type: "note",
          timestamp: msg.created_date,
          title: msg.role === "assistant" ? "AI Assistant Message" : "Referral Message",
          description: msg.content.slice(0, 120) + (msg.content.length > 120 ? "…" : ""),
          icon: msg.role === "assistant" ? Activity : FileText,
          color: msg.role === "assistant" ? "gold" : "accent",
          meta: msg.message_type === "audio" ? "voice" : msg.message_type === "image" ? "image" : null,
        });
      });
    } catch {}

    // Sort all by timestamp descending (most recent first)
    items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setEvents(items);
    setLoading(false);
  };

  const filtered = filter === "all" ? events : events.filter((e) => e.type === filter);

  const filters = [
    { id: "all", label: "All" },
    { id: "status", label: "Status" },
    { id: "note", label: "Notes" },
    { id: "lab", label: "Labs" },
    { id: "review", label: "Reviews" },
    { id: "imaging", label: "Imaging" },
  ];

  const colorMap = {
    accent: "bg-accent/15 text-accent border-accent/30",
    gold: "bg-hive-gold/15 text-hive-gold border-hive-gold/30",
    success: "bg-success/15 text-success border-success/30",
    warning: "bg-warning/15 text-warning border-warning/30",
    destructive: "bg-destructive/15 text-destructive border-destructive/30",
    muted: "bg-muted text-muted-foreground border-border",
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-border border-t-hive-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-thin pb-1">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === f.id
                ? "bg-hive-gold text-hive-gold-foreground"
                : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">{filtered.length} event{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No timeline events yet for this filter.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />

          <div className="space-y-4">
            {filtered.map((event, i) => {
              const Icon = event.icon;
              return (
                <div key={i} className="relative flex gap-4 animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                  {/* Icon node */}
                  <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 flex-shrink-0 ${colorMap[event.color] || colorMap.muted} bg-background`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-card border border-border rounded-xl px-4 py-3 hover:border-hive-gold/20 transition-colors min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{event.title}</h4>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {new Date(event.timestamp).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
                        {" · "}
                        {new Date(event.timestamp).toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                    )}
                    {event.meta && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-[10px] font-medium text-muted-foreground">
                          {event.meta}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{timeAgo(event.timestamp)}</span>
                      </div>
                    )}
                    {!event.meta && (
                      <p className="text-[10px] text-muted-foreground mt-1.5">{timeAgo(event.timestamp)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}