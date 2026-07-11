import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Plus, Trash2, Lock, Loader2, FileText, Stethoscope, Users, MessageSquare, ShieldCheck } from "lucide-react";

const GRADE_LABELS = { nchd: "NCHD", sho: "SHO", registrar: "Registrar", consultant: "Consultant" };

const NOTE_TYPES = {
  admission: { label: "Admission", icon: FileText, color: "bg-hive-gold/15 text-hive-gold border-hive-gold/30" },
  review: { label: "Review", icon: Stethoscope, color: "bg-accent/15 text-accent border-accent/30" },
  handover: { label: "Handover", icon: Users, color: "bg-success/15 text-success border-success/30" },
  general: { label: "General", icon: MessageSquare, color: "bg-secondary text-muted-foreground border-border" },
};

const TYPE_ORDER = ["review", "admission", "handover", "general"];

function fmtTimestamp(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })
    + " · " + d.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
}

export default function ChronologicalNotes({ caseData }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState("review");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    loadNotes();
  }, [caseData.id]);

  const loadNotes = async () => {
    try {
      const data = await base44.entities.CaseNote.filter({ case_id: caseData.id }, "-created_date", 200);
      setNotes(data);
    } catch (err) {
      console.error("Failed to load notes:", err);
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
      await loadNotes();
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
      await loadNotes();
    } catch {
      alert("Failed to remove note.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-card/60 backdrop-blur-md border border-hive-gold/20 rounded-xl">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <FileText className="w-4 h-4 text-accent" />
        <h3 className="font-medium text-foreground text-[13px] flex-1">Patient Record & Notes</h3>
        <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{notes.length} note{notes.length !== 1 ? "s" : ""}</span>
        {isAdmin && (
          <span className="inline-flex items-center gap-1 text-[10px] text-hive-gold">
            <ShieldCheck className="w-3 h-3" /> Admin
          </span>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Notes list — chronological, newest first */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-hive-gold" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No notes recorded yet. Add the first note below.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[15px] top-1 bottom-1 w-0.5 bg-border" />
            <div className="space-y-3">
              {notes.map((note) => {
                const typeConfig = NOTE_TYPES[note.note_type] || NOTE_TYPES.general;
                const TypeIcon = typeConfig.icon;
                return (
                  <div key={note.id} className="relative flex gap-3 animate-fade-in">
                    {/* Icon node */}
                    <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0 ${typeConfig.color} bg-background`}>
                      <TypeIcon className="w-3.5 h-3.5" />
                    </div>

                    {/* Note card */}
                    <div className="flex-1 bg-background/50 border border-border/50 rounded-lg px-3 py-2.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                        {note.is_locked && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-hive-gold">
                            <Lock className="w-2.5 h-2.5" /> Permanent
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto whitespace-nowrap">
                          {fmtTimestamp(note.created_date)}
                        </span>
                      </div>

                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{note.content}</p>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-[10px] font-medium text-muted-foreground">
                          {note.author_name}
                          {note.author_grade && ` · ${GRADE_LABELS[note.author_grade] || note.author_grade}`}
                        </span>
                        {note.author_imc && (
                          <span className="text-[10px] text-muted-foreground">IMC: {note.author_imc}</span>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(note.id)}
                            disabled={deletingId === note.id}
                            className="ml-auto inline-flex items-center gap-1 text-[10px] text-destructive hover:text-destructive/80 disabled:opacity-40"
                          >
                            {deletingId === note.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add note form */}
        <div className="border-t border-border pt-4">
          {/* Type selector */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Note Type:</span>
            {TYPE_ORDER.map((t) => {
              const config = NOTE_TYPES[t];
              const TypeIcon = config.icon;
              return (
                <button
                  key={t}
                  onClick={() => setNoteType(t)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
                    noteType === t ? config.color : "bg-secondary border-border text-muted-foreground hover:text-foreground"
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
            rows={3}
            placeholder="Write your clinical note…"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50 resize-none"
          />

          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">
              Adding as: <span className="text-foreground font-medium">{user?.full_name || "Unknown"}</span>
              {user?.clinical_grade && ` · ${GRADE_LABELS[user.clinical_grade] || user.clinical_grade}`}
            </span>
            <button
              onClick={handleAdd}
              disabled={saving || !content.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hive-gold text-hive-gold-foreground text-xs font-semibold hover:bg-hive-gold/90 disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}