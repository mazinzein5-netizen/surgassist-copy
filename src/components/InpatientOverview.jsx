import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ClipboardCheck, FileText, Loader2, Clock, ChevronRight, Plus } from "lucide-react";
import FormattedAdmissionNote from "@/components/FormattedAdmissionNote";

function fmtTimestamp(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })
    + " · " + d.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
}

const NOTE_TYPE_LABELS = {
  admission: "Admission Note",
  review: "Review Note",
  handover: "Handover",
  general: "Note",
};

export default function InpatientOverview({ caseData, onAddNote }) {
  const [lastNote, setLastNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLastNote();
  }, [caseData.id]);

  const loadLastNote = async () => {
    try {
      const notes = await base44.entities.CaseNote.filter({ case_id: caseData.id }, "-created_date", 1);
      setLastNote(notes[0] || null);
    } catch {
      setLastNote(null);
    } finally {
      setLoading(false);
    }
  };

  const plan = caseData.treatment_plan;
  const admissionDate = caseData.admission_date;

  return (
    <div className="space-y-3">
      {/* Unified Last Note + Current Plan */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Header with Add Note button */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <FileText className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Last Note</h3>
          {admissionDate && (
            <span className="text-[10px] text-gray-400">
              Admitted {new Date(admissionDate).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
          <button
            onClick={onAddNote}
            className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Note
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Last note content */}
          {loading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
            </div>
          ) : lastNote ? (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                  {NOTE_TYPE_LABELS[lastNote.note_type] || "Note"}
                </span>
                <span className="text-[10px] text-gray-400">{fmtTimestamp(lastNote.created_date)}</span>
                <span className="text-[10px] text-gray-400 ml-auto">
                  {lastNote.author_name}{lastNote.author_grade ? ` · ${lastNote.author_grade}` : ""}
                </span>
              </div>
              <div className="line-clamp-4 overflow-hidden"><FormattedAdmissionNote note={lastNote.content} /></div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No notes recorded since admission.</p>
          )}

          {/* Current Plan inside the same section */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardCheck className="w-4 h-4 text-hive-gold" />
              <h4 className="text-sm font-bold text-gray-900">Current Plan</h4>
              {caseData.note_locked_at && (
                <span className="text-[10px] text-gray-400 ml-auto flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Updated {fmtTimestamp(caseData.note_locked_at)}
                </span>
              )}
            </div>
            {plan ? (
              <FormattedAdmissionNote note={plan} />
            ) : (
              <p className="text-sm text-gray-400 italic">No plan documented yet. Add a plan in the Admission & Plan section below.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}