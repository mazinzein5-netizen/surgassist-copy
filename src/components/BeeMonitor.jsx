import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { RefreshCw, ShieldAlert, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

export default function BeeMonitor({ caseData, kardex }) {
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  const autoTriggered = useRef(false);

  const kardexData = kardex || caseData.kardex_data;
  const hasKardex = kardexData && kardexData.medications && kardexData.medications.length > 0;

  // Subscribe to conversation updates
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

  // Auto-trigger analysis when kardex becomes available
  useEffect(() => {
    if (hasKardex && !autoTriggered.current) {
      autoTriggered.current = true;
      handleAnalyze();
    }
  }, [hasKardex]);

  const handleAnalyze = async () => {
    if (!hasKardex) return;
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);
    try {
      const medList =
        kardexData.medications
          ?.map((m) => `${m.drug} ${m.dose} ${m.route} ${m.frequency} — ${m.indication || "no indication"}`)
          .join("\n- ") || "No medications documented";

      const message = `\ud83d\udc1d Please review the inpatient kardex for patient **${caseData.patient_name}** (MRN: ${caseData.patient_mrn || "N/A"}, DOB: ${caseData.patient_dob || "N/A"}).

## Current Medications
- ${medList}

## IV Fluid Plan
${kardexData.iv_fluids || "Not documented"}

## Treatment Plan
${kardexData.treatment_plan || "Not documented"}

## Pre-Op Status
${caseData.pre_op_status || "not_listed"}

## Presenting Complaint
${caseData.presenting_complaint || "Not documented"}

Please check for:
1. **Drug-drug interactions** between prescribed medications
2. **Contraindications** based on the patient's presenting complaint and documented conditions
3. **Preoperative medication adjustments** \u2014 which to hold, continue, or bridge if going to theatre
4. **Dose safety concerns** \u2014 any doses outside standard adult ranges
5. **Renal/hepatic considerations** \u2014 medications needing dose adjustment

Present findings with severity markers: \ud83d\udd34 RED (contraindication/danger), \u26a0\ufe0f YELLOW (caution), \u2705 GREEN (safe). Keep it concise and actionable. End with "Stay safe! \ud83d\udc1d"`;

      const convo = await base44.agents.createConversation({
        agent_name: "TheBee",
        metadata: {
          name: `Kardex Review \u2014 ${caseData.patient_name}`,
          description: "Drug safety review",
        },
      });
      setConversationId(convo.id);
      await base44.agents.addMessage(convo, { role: "user", content: message });
    } catch {
      setError("The Bee couldn't start the review. Please try again.");
      setAnalyzing(false);
    }
  };

  if (!hasKardex) return null;

  return (
    <div className="bg-gradient-to-br from-warning/5 to-hive-gold/5 border border-warning/20 rounded-xl overflow-hidden hex-pattern-dense">
      {/* Bee Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-warning/5 border-b border-warning/15">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2.5">
          <BeeAvatar analyzing={analyzing} />
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              The Bee
              <span className="text-xs">🐝</span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {analyzing
                ? "Buzzing through your kardex..."
                : analysis
                  ? "Review complete — see findings below"
                  : "Drug Safety Monitor"}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-1">
          {!analyzing && (
            <button
              onClick={handleAnalyze}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-warning/15 text-warning text-xs font-semibold hover:bg-warning/25 border border-warning/20 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              {analysis ? "Re-scan" : "Analyze"}
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
          {/* Analyzing state */}
          {analyzing && !analysis && (
            <div className="flex items-center gap-3 py-3">
              <BeeAvatar analyzing={true} size="lg" />
              <div>
                <p className="text-sm text-foreground font-medium">Buzz... checking medications...</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cross-referencing allergies, interactions & preop adjustments
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Dots />
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Analysis results */}
          {analysis && (
            <div className="bg-card/60 rounded-lg p-3 border border-warning/10">
              <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                {analysis}
              </ReactMarkdown>
            </div>
          )}

          {/* Idle state */}
          {!analyzing && !analysis && !error && (
            <div className="flex items-center gap-3 py-2">
              <BeeAvatar analyzing={false} />
              <p className="text-sm text-muted-foreground">
                Click <span className="font-semibold text-warning">Analyze</span> to have The Bee check for drug
                interactions, contraindications, and preoperative adjustments.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BeeAvatar({ analyzing = false, size = "sm" }) {
  const sizeClass = size === "lg" ? "text-3xl" : "text-xl";
  return (
    <div className={`relative flex-shrink-0 ${analyzing ? "animate-bee-buzz" : "animate-bee-hover"}`}>
      <div
        className={`flex items-center justify-center rounded-full ${sizeClass} ${
          analyzing
            ? "bg-warning/20 border-2 border-warning/40"
            : "bg-warning/10 border-2 border-warning/20"
        }`}
        style={{ width: size === "lg" ? 48 : 36, height: size === "lg" ? 48 : 36 }}
      >
        🐝
      </div>
      {analyzing && (
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-warning animate-pulse-gold border border-warning/40" />
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
          className="w-1.5 h-1.5 rounded-full bg-warning/60"
          style={{
            animation: `pulse-gold 1s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  );
}