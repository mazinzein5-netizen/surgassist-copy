import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { BedDouble, Scissors, Share2, Loader2 } from "lucide-react";

export default function PathwayActions({ caseData, onUpdate, user, onRequestTheatre }) {
  const [acting, setActing] = useState(null);

  const updateNote = () => ({
    note_author_name: user?.full_name || "Unknown",
    note_author_grade: user?.clinical_grade || "nchd",
    note_author_imc: user?.imc_number || "",
    note_locked_at: new Date().toISOString(),
  });

  const handleAdmit = async () => {
    setActing("admit");
    try {
      await base44.entities.CaseFile.update(caseData.id, {
        status: "admitted",
        pre_op_status: "not_applicable",
        admission_date: caseData.admission_date || new Date().toISOString(),
        ...updateNote(),
      });
      onUpdate();
    } catch { alert("Failed to admit patient."); }
    finally { setActing(null); }
  };

  const handleTheatre = () => {
    onRequestTheatre?.();
  };

  const handleRefer = async () => {
    const specialty = prompt("Enter accepting specialty/team:");
    if (!specialty) return;
    setActing("refer");
    try {
      await base44.entities.CaseFile.update(caseData.id, {
        accepting_specialty: specialty,
        status: "declined",
        triage_decision: "decline",
        ...updateNote(),
      });
      onUpdate();
    } catch { alert("Failed to refer patient."); }
    finally { setActing(null); }
  };

  const showActions = ["accepted", "clerking", "investigations"].includes(caseData.status);
  if (!showActions) return null;

  const btnClass = "flex flex-col items-start p-4 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors text-left disabled:opacity-50";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      <button onClick={handleAdmit} disabled={!!acting} className={btnClass}>
        <div className="flex items-center gap-2 mb-1">
          {acting === "admit" ? <Loader2 className="w-5 h-5 text-gray-500 animate-spin" /> : <BedDouble className="w-5 h-5 text-gray-700" />}
          <span className="font-semibold text-sm text-gray-900">Admit & Treat</span>
        </div>
        <span className="text-xs text-gray-500">Conservative management — admit to ward</span>
      </button>
      <button onClick={handleTheatre} disabled={!!acting} className={btnClass}>
        <div className="flex items-center gap-2 mb-1">
          {acting === "theatre" ? <Loader2 className="w-5 h-5 text-gray-500 animate-spin" /> : <Scissors className="w-5 h-5 text-gray-700" />}
          <span className="font-semibold text-sm text-gray-900">Book for Surgery</span>
        </div>
        <span className="text-xs text-gray-500">Jack reviews notes & RCS protocol first</span>
      </button>
      <button onClick={handleRefer} disabled={!!acting} className={btnClass}>
        <div className="flex items-center gap-2 mb-1">
          {acting === "refer" ? <Loader2 className="w-5 h-5 text-gray-500 animate-spin" /> : <Share2 className="w-5 h-5 text-gray-700" />}
          <span className="font-semibold text-sm text-gray-900">Refer to Specialty</span>
        </div>
        <span className="text-xs text-gray-500">Redirect to another team</span>
      </button>
    </div>
  );
}