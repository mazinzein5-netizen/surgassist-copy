import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { ShieldCheck, RefreshCw, ChevronDown, ChevronUp, AlertCircle, Loader2 } from "lucide-react";

export default function JackSafetyPanel({ caseData }) {
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  const autoTriggered = useRef(false);

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
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [conversationId]);

  useEffect(() => {
    if (caseData && !autoTriggered.current) {
      autoTriggered.current = true;
      handleAnalyze();
    }
  }, [caseData?.id]);

  const handleAnalyze = async () => {
    if (!caseData) return;
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);
    try {
      // Gather all relevant data for Jack
      let labs = [];
      let photos = [];
      try {
        labs = await base44.entities.LabResult.filter({ case_id: caseData.id }, "-collected_at", 50);
      } catch {}
      try {
        photos = await base44.entities.ClinicalPhoto.filter({ case_id: caseData.id });
      } catch {}

      const labSummary = labs.length > 0
        ? labs.map(l => `${l.test_type}: ${l.value}${l.unit || ""} (collected ${l.collected_at ? new Date(l.collected_at).toLocaleDateString("en-IE") : "N/A"})`).join("\n- ")
        : "No lab results on file";

      const photoSummary = photos.length > 0
        ? photos.map(p => `${p.photo_type}${p.caption ? ` — ${p.caption}` : ""}`).join("\n- ")
        : "No clinical photos on file";

      const proformaData = caseData.proforma_data
        ? Object.entries(caseData.proforma_data).filter(([, v]) => v?.answer).map(([k, v]) => `${k.split("::")[1] || k}: ${v.answer}${v.detail ? ` (${v.detail})` : ""}`).join("\n- ")
        : "No proforma data";

      const kardexMeds = caseData.kardex_data?.medications
        ? caseData.kardex_data.medications.map(m => `${m.drug} ${m.dose} ${m.route} ${m.frequency} — ${m.indication || "no indication"}`).join("\n- ")
        : "No kardex generated";

      const message = `🛡️ Please run a full safety and guidelines check for patient **${caseData.patient_name}** (MRN: ${caseData.patient_mrn || "N/A"}, DOB: ${caseData.patient_dob || "N/A"}).

## Case Overview
- **Department**: ${caseData.department || "N/A"}
- **Status**: ${caseData.status || "N/A"}
- **Presenting Complaint**: ${caseData.presenting_complaint || "Not documented"}
- **Mechanism of Injury**: ${caseData.mechanism_of_injury || "N/A"}
- **Triage Decision**: ${caseData.triage_decision || "pending"}
- **Pre-Op Status**: ${caseData.pre_op_status || "not_listed"}
- **Procedure**: ${caseData.procedure_name || "Not listed"}
- **POD**: ${caseData.pod || "N/A"}
- **INEWS Score**: ${caseData.inews_score || "Not recorded"}

## Clerking / Proforma
- ${proformaData}

## Lab Results
- ${labSummary}

## Clinical Photos / Imaging
- ${photoSummary}

## Current Medications (Kardex)
- ${kardexMeds}

## IV Fluids
${caseData.kardex_data?.iv_fluids || caseData.iv_fluid_plan || "Not documented"}

## Treatment Plan
${caseData.treatment_plan || "Not documented"}

## Consent Status
${caseData.consent_checklist || "Not documented"}

## Referral Summary
${caseData.referral_summary || "Not documented"}

Please check everything against:
1. RCSI clinical curriculum standards
2. Irish/UK surgical guidelines (NICE, HIQA, NCEC)
3. Perioperative care pathway (fasting, anticoagulation, diabetic management, VTE prophylaxis, antibiotic prophylaxis)
4. Drug interactions and contraindications
5. Abnormal or critical lab values requiring action
6. Missing investigations or documentation
7. INEWS escalation appropriateness
8. Operative care safety (if pre-op or post-op)

Present your full analysis per your output format. Remember: patient safety is not negotiable.`;

      const convo = await base44.agents.createConversation({
        agent_name: "Jack",
        metadata: {
          name: `Safety Check — ${caseData.patient_name}`,
          description: "Guidelines & safety review",
        },
      });
      setConversationId(convo.id);
      await base44.agents.addMessage(convo, { role: "user", content: message });
    } catch {
      setError("Jack couldn't start the safety check. Please try again.");
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-destructive/5 to-accent/5 border border-destructive/20 rounded-xl overflow-hidden hex-pattern-dense">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-destructive/5 border-b border-destructive/15">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2.5">
          <JackAvatar analyzing={analyzing} />
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Jack
              <span className="text-xs">🛡️</span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {analyzing
                ? "Checking guidelines & safety..."
                : analysis
                  ? "Safety check complete — see findings"
                  : "Safety & Guidelines Guardian"}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-1">
          {!analyzing && (
            <button
              onClick={handleAnalyze}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs font-semibold hover:bg-destructive/25 border border-destructive/20 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              {analysis ? "Re-check" : "Run Check"}
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4">
          {analyzing && !analysis && (
            <div className="flex items-center gap-3 py-3">
              <JackAvatar analyzing={true} size="lg" />
              <div>
                <p className="text-sm text-foreground font-medium">Cross-referencing RCSI curriculum & guidelines...</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Checking perioperative safety, labs, medications & missing data
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Dots />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {analysis && (
            <div className="bg-card/60 rounded-lg p-3 border border-destructive/10">
              <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                {analysis}
              </ReactMarkdown>
            </div>
          )}

          {!analyzing && !analysis && !error && (
            <div className="flex items-center gap-3 py-2">
              <JackAvatar analyzing={false} />
              <p className="text-sm text-muted-foreground">
                Click <span className="font-semibold text-destructive">Run Check</span> to have Jack review this case
                against RCSI curriculum, Irish/UK guidelines, and perioperative safety standards.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function JackAvatar({ analyzing = false, size = "sm" }) {
  const sizeClass = size === "lg" ? "text-3xl" : "text-xl";
  return (
    <div className={`relative flex-shrink-0 ${analyzing ? "animate-bee-buzz" : "animate-bee-hover"}`}>
      <div
        className={`flex items-center justify-center rounded-full ${sizeClass} ${
          analyzing
            ? "bg-destructive/20 border-2 border-destructive/40"
            : "bg-destructive/10 border-2 border-destructive/20"
        }`}
        style={{ width: size === "lg" ? 48 : 36, height: size === "lg" ? 48 : 36 }}
      >
        🛡️
      </div>
      {analyzing && (
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive animate-pulse-gold border border-destructive/40" />
      )}
    </div>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-destructive/60"
          style={{ animation: `pulse-gold 1s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </span>
  );
}