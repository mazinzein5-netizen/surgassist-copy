import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Plus, Trash2, Lock, Loader2, FileText, Stethoscope, Users, MessageSquare, ShieldCheck, FlaskConical, Scan, Activity, ShieldAlert } from "lucide-react";
import FormattedAdmissionNote from "@/components/FormattedAdmissionNote";

const GRADE_LABELS = { nchd: "NCHD", sho: "SHO", registrar: "Registrar", consultant: "Consultant" };

const TYPE_CONFIG = {
  referral: { label: "Referral", icon: Activity, color: "bg-amber-500 text-white", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  admission: { label: "Admission", icon: FileText, color: "bg-hive-gold text-hive-gold-foreground", badge: "bg-hive-gold/15 text-hive-gold border-hive-gold/30" },
  review: { label: "Review", icon: Stethoscope, color: "bg-blue-500 text-white", badge: "bg-accent/15 text-accent border-accent/30" },
  handover: { label: "Handover", icon: Users, color: "bg-green-500 text-white", badge: "bg-success/15 text-success border-success/30" },
  general: { label: "General", icon: MessageSquare, color: "bg-gray-500 text-white", badge: "bg-secondary text-muted-foreground border-border" },
  lab: { label: "Investigation", icon: FlaskConical, color: "bg-purple-500 text-white", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  imaging: { label: "Imaging", icon: Scan, color: "bg-cyan-500 text-white", badge: "bg-cyan-50 text-cyan-700 border-cyan-200" },
};

const NOTE_TYPE_ORDER = ["review", "admission", "handover", "general"];

function fmtTimestamp(ts) {
  const d = new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-IE", { day: "numeric", month: "short" });
}

function fmtFull(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })
    + " · " + d.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
}

export default function CaseRecordTimeline({ caseData }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState("review");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    loadAll();
  }, [caseData.id]);

  const loadAll = async () => {
    try {
      const [notes, labs, photos] = await Promise.all([
        base44.entities.CaseNote.filter({ case_id: caseData.id }, "-created_date", 200).catch(() => []),
        base44.entities.LabResult.filter({ case_id: caseData.id }, "-collected_at", 50).catch(() => []),
        base44.entities.ClinicalPhoto.filter({ case_id: caseData.id }).catch(() => []),
      ]);

      const all = [];

      // Referral milestone
      all.push({
        id: "referral-" + caseData.id,
        type: "referral",
        timestamp: caseData.created_date,
        title: "Referral Received",
        detail: caseData.presenting_complaint || caseData.referral_summary || "Case opened",
        author: caseData.referrer_name,
        isNote: false,
      });

      // Admission milestone
      if (caseData.admission_date) {
        all.push({
          id: "admission-" + caseData.id,
          type: "admission",
          timestamp: caseData.admission_date,
          title: "Patient Admitted",
          detail: caseData.diagnosis || caseData.presenting_complaint || "",
          author: caseData.note_author_name,
          isNote: false,
        });
      }

      // Notes
      notes.forEach(n => {
        all.push({
          id: n.id,
          type: n.note_type || "review",
          timestamp: n.created_date,
          title: (TYPE_CONFIG[n.note_type]?.label || "Note") + " Note",
          detail: n.content,
          author: n.author_name,
          authorGrade: n.author_grade,
          authorImc: n.author_imc,
          isLocked: n.is_locked,
          isNote: true,
        });
      });

      // Labs
      labs.forEach(l => {
        all.push({
          id: l.id,
          type: "lab",
          timestamp: l.collected_at || l.created_date,
          title: `${l.test_type}: ${l.value}${l.unit ? " " + l.unit : ""}`,
          detail: "Blood investigation result",
          isNote: false,
        });
      });

      // Photos / imaging
      photos.forEach(p => {
        all.push({
          id: p.id,
          type: "imaging",
          timestamp: p.created_date,
          title: p.caption || (p.photo_type?.replace(/_/g, " ") || "Clinical photo"),
          detail: p.photo_type?.replace(/_/g, " "),
          isNote: false,
        });
      });

      all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setItems(all);
    } catch (err) {
      console.error("Timeline error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await base44.entities.CaseNote.create({
        case_id: caseData.id,
        patient_id: caseData.patient_id || "",
        note_type: noteType,
        content: content.trim(),
        author_name: user?.full_name || "Unknown",
        author_id: user?.id || "",
        author_grade: user?.clinical_grade || "nchd",
        author_imc: user?.imc_number || "",
        is_locked: false,
      });
      setContent("");
      await loadAll();
    } catch {
      alert("Failed to add note.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!confirm("Remove this note from the patient record?")) return;
    setDeletingId(noteId);
    try {
      await base44.entities.CaseNote.delete(noteId);
      await loadAll();
    } catch {
      alert("Failed to remove note.");
    } finally {
      setDeletingId(null);
    }
  };

  const noteCount = items.filter(i => i.isNote).length;

  return (
    <div className="space-y-3">
      {/* Unified timeline with vertical line on the left */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-6">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-400">No entries yet. Add the first note below.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-1 bottom-1 w-0.5 bg-gray-200" />
          <div className="space-y-3">
            {items.map((item) => {
              const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.general;
              const Icon = config.icon;
              return (
                <div key={item.id} className="relative flex gap-3 animate-fade-in">
                  {/* Icon node on the line */}
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${config.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {/* Content card */}
                  <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.badge}`}>
                        {config.label}
                      </span>
                      {item.isLocked && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-hive-gold">
                          <Lock className="w-2.5 h-2.5" /> Permanent
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 ml-auto whitespace-nowrap" title={fmtFull(item.timestamp)}>
                        {fmtTimestamp(item.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-gray-900 mb-0.5">{item.title}</p>

                    {item.isNote ? (
                      <FormattedAdmissionNote note={item.detail} />
                    ) : (
                      item.detail && <p className="text-xs text-gray-500 leading-relaxed">{item.detail}</p>
                    )}

                    {item.isNote && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-medium text-gray-500">
                          {item.author}
                          {item.authorGrade && ` · ${GRADE_LABELS[item.authorGrade] || item.authorGrade}`}
                        </span>
                        {item.authorImc && (
                          <span className="text-[10px] text-gray-400">IMC: {item.authorImc}</span>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="ml-auto inline-flex items-center gap-1 text-[10px] text-red-600 hover:text-red-400 disabled:opacity-40"
                          >
                            {deletingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add note form */}
      <div className="border-t border-gray-200 pt-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[10px] font-semibold text-gray-400 uppercase">Note Type:</span>
          {NOTE_TYPE_ORDER.map((t) => {
            const config = TYPE_CONFIG[t];
            const TypeIcon = config.icon;
            return (
              <button
                key={t}
                onClick={() => setNoteType(t)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
                  noteType === t ? config.badge : "bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-700"
                }`}
              >
                <TypeIcon className="w-3 h-3" />
                {config.label}
              </button>
            );
          })}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="Write your clinical note…"
          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 resize-none"
        />

        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-gray-400">
            Adding as: <span className="text-gray-700 font-medium">{user?.full_name || "Unknown"}</span>
            {user?.clinical_grade && ` · ${GRADE_LABELS[user.clinical_grade] || user.clinical_grade}`}
          </span>
          <button
            onClick={handleAdd}
            disabled={saving || !content.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add Note
          </button>
        </div>
      </div>
    </div>
  );
}