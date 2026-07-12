import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { FlaskConical, Scan, Loader2, RefreshCw, ChevronDown, ChevronUp, AlertCircle, Activity, Image, ArrowUp, ArrowDown } from "lucide-react";
import { isOutOfRange, formatRange, LAB_RANGES } from "@/lib/labReferenceRanges";

export default function LabsImagingDiscovery({ caseData }) {
  const [labs, setLabs] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [summary, setSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    loadData();
  }, [caseData?.id]);

  const loadData = async () => {
    if (!caseData?.id) return;
    let labData = [];
    let photoData = [];
    try {
      labData = await base44.entities.LabResult.filter({ case_id: caseData.id }, "-collected_at", 50);
      setLabs(labData);
    } catch {}
    try {
      photoData = await base44.entities.ClinicalPhoto.filter({ case_id: caseData.id });
      setPhotos(photoData);
    } catch {}

    // Auto-summarize if there's data
    if ((labData.length > 0 || photoData.length > 0) && !summary && !summarizing) {
      handleSummarize(labData, photoData);
    }
  };

  const handleSummarize = async (labList, photoList) => {
    const labData = labList.length > 0 ? labList : labs;
    const photoData = photoList.length > 0 ? photoList : photos;

    if (labData.length === 0 && photoData.length === 0) return;

    setSummarizing(true);
    setError(null);
    try {
      const labText = labData.length > 0
        ? labData.map(l => `- ${l.test_type}: ${l.value}${l.unit || ""} (collected ${l.collected_at ? new Date(l.collected_at).toLocaleDateString("en-IE") : "N/A"}, source: ${l.source || "manual"})`).join("\n")
        : "No lab results available.";

      const photoText = photoData.length > 0
        ? photoData.map(p => `- ${p.photo_type}${p.caption ? ` — ${p.caption}` : ""}`).join("\n")
        : "No imaging/clinical photos available.";

      const prompt = `You are a clinical assistant reviewing labs and imaging for a surgical patient. Analyze the following data and provide a concise, actionable summary.

## Patient
- Name: ${caseData.patient_name || "Unknown"}
- MRN: ${caseData.patient_mrn || "N/A"}
- Department: ${caseData.department || "N/A"}
- Presenting complaint: ${caseData.presenting_complaint || "Not documented"}
- Status: ${caseData.status || "N/A"}
- Pre-op status: ${caseData.pre_op_status || "not_listed"}

## Lab Results
${labText}

## Imaging / Clinical Photos
${photoText}

## Known investigation recommendations
${caseData.investigation_data ? JSON.stringify(caseData.investigation_data) : "None documented"}

Please provide:
1. **Key Abnormalities** — any critical or abnormal values that need urgent attention (with reference ranges where applicable)
2. **Missing Investigations** — what labs or imaging are still needed based on the presentation
3. **Trends** — if multiple results exist, note any concerning trends
4. **Action Items** — numbered list of what should be done next

Keep it concise and clinically focused. Use bullet points.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: null,
      });

      setSummary(typeof result === "string" ? result : JSON.stringify(result, null, 2));
    } catch {
      setError("Failed to generate summary. You can still view the raw data below.");
    } finally {
      setSummarizing(false);
    }
  };

  const hasData = labs.length > 0 || photos.length > 0;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-accent/5">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4 text-accent" />
            <Scan className="w-4 h-4 text-accent" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Labs & Imaging Discovery</p>
            <p className="text-[10px] text-muted-foreground">
              {labs.length} lab result{labs.length !== 1 ? "s" : ""} · {photos.length} image{photos.length !== 1 ? "s" : ""}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-1">
          {hasData && !summarizing && (
            <button
              onClick={() => handleSummarize([], [])}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent/15 text-accent text-xs font-semibold hover:bg-accent/25 border border-accent/20 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              {summary ? "Re-summarize" : "Summarize"}
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
        <div className="p-4 space-y-4">
          {/* AI Summary */}
          {summarizing && (
            <div className="flex items-center gap-3 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
              <div>
                <p className="text-sm text-foreground font-medium">Analyzing labs & imaging...</p>
                <p className="text-xs text-muted-foreground mt-0.5">Identifying abnormalities and missing tests</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {summary && !summarizing && (
            <div className="bg-accent/5 rounded-lg p-3 border border-accent/15">
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">AI Summary</span>
              </div>
              <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                {summary}
              </ReactMarkdown>
            </div>
          )}

          {/* Lab Results Table */}
          {labs.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FlaskConical className="w-3.5 h-3.5 text-accent" />
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lab Results</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="text-left px-3 py-2 font-medium">Test</th>
                      <th className="text-left px-3 py-2 font-medium">Value</th>
                      <th className="text-left px-3 py-2 font-medium">Range</th>
                      <th className="text-left px-3 py-2 font-medium">Collected</th>
                      <th className="text-left px-3 py-2 font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labs.map((lab, i) => {
                      const abnormal = isOutOfRange(lab.test_type, lab.value);
                      const arrow = abnormal && lab.value < (LAB_RANGES[lab.test_type]?.min) ? "down" : abnormal ? "up" : null;
                      return (
                        <tr key={i} className={`border-b border-border/50 ${abnormal ? "bg-red-500/10" : ""}`}>
                          <td className="px-3 py-2 font-medium text-foreground capitalize">{lab.test_type?.replace(/_/g, " ")}</td>
                          <td className="px-3 py-2">
                            <span className={`font-semibold ${abnormal ? "text-red-500" : "text-foreground"}`}>
                              {lab.value}{lab.unit && <span className="text-xs ml-1">{lab.unit}</span>}
                            </span>
                            {abnormal && (
                              <span className="ml-1.5 inline-flex text-red-500">
                                {arrow === "up" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{formatRange(lab.test_type) || "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground text-xs">{lab.collected_at ? new Date(lab.collected_at).toLocaleDateString("en-IE") : "—"}</td>
                          <td className="px-3 py-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${lab.source === "ocr_ingestion" ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}>
                              {lab.source || "manual"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Clinical Photos / Imaging */}
          {photos.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Image className="w-3.5 h-3.5 text-accent" />
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Imaging & Clinical Photos</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {photos.map((photo, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={photo.photo_url}
                      alt={photo.photo_type}
                      className="w-full h-24 rounded-lg object-cover border border-border"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 rounded-b-lg truncate">
                      {photo.photo_type?.replace(/_/g, " ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!hasData && !summarizing && (
            <div className="text-center py-6">
              <FlaskConical className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No labs or imaging found for this case yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Results added via Investigations or Imaging tabs will appear here automatically.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}