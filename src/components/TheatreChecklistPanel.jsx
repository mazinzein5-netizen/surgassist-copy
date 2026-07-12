import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { Loader2, X, Scissors, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

export default function TheatreChecklistPanel({ caseData, user, onClose, onUpdate }) {
  const [analyzing, setAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [notes, setNotes] = useState([]);
  const autoTriggered = useRef(false);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const caseNotes = await base44.entities.CaseNote.filter({ case_id: caseData.id }, "created_date", 100);
        setNotes(caseNotes);
      } catch {}
    };
    fetchNotes();
  }, [caseData.id]);

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      const msgs = data.messages || [];
      const lastAssistant = [...msgs].reverse().find((m) => m.role === "assistant" && m.content);
      if (lastAssistant) {
        setAnalysis(lastAssistant.content);
        setAnalyzing(false);
      }
    });
    return () => { if (typeof unsubscribe === "function") unsubscribe(); };
  }, [conversationId]);

  useEffect(() => {
    if (caseData && !autoTriggered.current) {
      autoTriggered.current = true;
      runChecklist();
    }
  }, [caseData?.id]);

  const runChecklist = async () => {
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);
    try {
      let labs = [];
      try {
        labs = await base44.entities.LabResult.filter({ case_id: caseData.id }, "-collected_at", 50);
      } catch {}

      const labSummary = labs.length > 0
        ? labs.map(l => `${l.test_type}: ${l.value}${l.unit || ""}`).join(", ")
        : "No lab results on file";

      const notesSummary = notes.length > 0
        ? notes.map(n => `--- ${n.note_type.toUpperCase()} NOTE by ${n.author_name} (${n.author_grade || "N/A"}) ---\n${n.content}`).join("\n\n")
        : "No progress notes recorded";

      const proformaData = caseData.proforma_data
        ? Object.entries(caseData.proforma_data).filter(([, v]) => v?.answer).map(([k, v]) => `${k.split("::")[1] || k}: ${v.answer}${v.detail ? ` (${v.detail})` : ""}`).join("\n- ")
        : "No proforma data";

      const kardexMeds = caseData.kardex_data?.medications
        ? caseData.kardex_data.medications.map(m => `${m.drug} ${m.dose} ${m.route} ${m.frequency}`).join(", ")
        : "No kardex";

      const message = `🏥 PRE-OPERATIVE CHECKLIST REVIEW for **${caseData.patient_name}** (MRN: ${caseData.patient_mrn || "N/A"})

The attending clinician wants to LIST THIS PATIENT FOR THEATRE. You MUST review ALL notes and clinical data and run a complete pre-operative safety checklist before approval.

## Case Overview
- Department: ${caseData.department || "N/A"}
- Diagnosis: ${caseData.diagnosis || "Not documented"}
- Presenting Complaint: ${caseData.presenting_complaint || "Not documented"}
- Proposed Procedure: ${caseData.procedure_name || "Not specified"}

## ALL Clinical Notes (Chronological — read every one)
${notesSummary}

## Clerking / Proforma
- ${proformaData}

## Lab Results
- ${labSummary}

## Consent Status
${caseData.consent_checklist || "Not documented"}

## Current Medications (Kardex)
${kardexMeds}

## PRE-OP CHECKLIST — verify EACH item with ✅ CLEARED, ⚠️ INCOMPLETE, or 🔴 NOT SAFE:
1. **Diagnosis & Indication** — Is the diagnosis clear and is surgery indicated?
2. **Consent** — Has valid informed consent been obtained? Risks/benefits/alternatives documented?
3. **Fasting** — Is the patient fasted? (2-4-6 rule)
4. **Anticoagulation** — If on anticoagulants, is there a hold/bridge plan?
5. **Diabetic Management** — If diabetic, is there a perioperative insulin/OHA plan?
6. **Antibiotic Prophylaxis** — Has antibiotic prophylaxis been planned?
7. **VTE Prophylaxis** — Has VTE risk assessment been done?
8. **Pre-op Investigations** — Are bloods, ECG, CXR, Group & Save complete?
9. **Anaesthetic Review** — Has the patient been assessed by anaesthetics?
10. **Allergies** — Are allergies documented and communicated?
11. **Red Flags** — Any contraindications to surgery?

## FINAL RECOMMENDATION:
End with one of:
- **GO** — Safe to proceed to theatre
- **CONDITIONAL GO** — May proceed with specified conditions
- **NO-GO** — Not safe to list; list what must be done first

Be thorough. Read every note. Patient safety is not negotiable.`;

      const convo = await base44.agents.createConversation({
        agent_name: "Jack",
        metadata: {
          name: `Pre-Op Checklist — ${caseData.patient_name}`,
          description: "Theatre listing safety review",
        },
      });
      setConversationId(convo.id);
      await base44.agents.addMessage(convo, { role: "user", content: message });
    } catch {
      setError("Jack couldn't start the pre-op checklist review. Please try again.");
      setAnalyzing(false);
    }
  };

  const handleConfirmList = async () => {
    setConfirming(true);
    try {
      await base44.entities.CaseFile.update(caseData.id, {
        pre_op_status: "listed",
        status: "admitted",
        admission_date: caseData.admission_date || new Date().toISOString(),
        note_author_name: user?.full_name || "Unknown",
        note_author_grade: user?.clinical_grade || "nchd",
        note_author_imc: user?.imc_number || "",
        note_locked_at: new Date().toISOString(),
      });
      onUpdate();
      onClose();
    } catch {
      alert("Failed to add patient to theatre list.");
    } finally {
      setConfirming(false);
    }
  };

  const isNoGo = analysis && /\bNO-?GO\b/i.test(analysis);
  const isConditional = analysis && /\bCONDITIONAL\b/i.test(analysis);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center text-lg">🛡️</div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Jack — Pre-Op Theatre Checklist</h2>
              <p className="text-[10px] text-gray-500">{caseData.patient_name} · Reviewing all notes before listing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {analyzing && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center text-2xl animate-bee-buzz mb-3">🛡️</div>
              <p className="text-sm font-medium text-gray-900">Jack is reading all clinical notes...</p>
              <p className="text-xs text-gray-500 mt-1">Running pre-operative safety checklist</p>
              <div className="flex items-center gap-1.5 mt-3">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-red-400" style={{ animation: `pulse-gold 1s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm py-4">
              <AlertTriangle className="w-4 h-4" />
              {error}
              <button onClick={runChecklist} className="ml-2 text-xs font-semibold underline">Retry</button>
            </div>
          )}

          {analysis && (
            <div className="space-y-4">
              <div className={`rounded-lg p-3 border flex items-center gap-2 ${isNoGo ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                {isNoGo
                  ? <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  : <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />}
                <span className={`text-sm font-bold ${isNoGo ? "text-red-700" : "text-green-700"}`}>
                  {isNoGo ? "NO-GO — Resolve issues before listing" : isConditional ? "CONDITIONAL GO — May proceed with conditions" : "GO — Cleared for theatre listing"}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  {analysis}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!analyzing && analysis && (
          <div className="px-5 py-4 border-t border-gray-200 flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-600 text-xs font-semibold hover:bg-gray-100">
              Cancel
            </button>
            <div className="flex-1" />
            <button onClick={runChecklist} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-600 text-xs font-semibold hover:bg-gray-100">
              <RefreshCw className="w-3.5 h-3.5" /> Re-run
            </button>
            <button
              onClick={handleConfirmList}
              disabled={confirming || isNoGo}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scissors className="w-3.5 h-3.5" />}
              {isNoGo ? "Cannot List" : "Confirm & Add to Theatre List"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}