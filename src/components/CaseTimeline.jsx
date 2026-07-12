import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, FlaskConical, Scan, Users, Stethoscope, Activity, MessageSquare } from "lucide-react";

const MILESTONE_CONFIG = {
  referral: { icon: Activity, dot: "bg-amber-500", label: "Referral" },
  admission: { icon: FileText, dot: "bg-hive-gold", label: "Admission" },
  review: { icon: Stethoscope, dot: "bg-blue-500", label: "Review" },
  handover: { icon: Users, dot: "bg-green-500", label: "Handover" },
  general: { icon: MessageSquare, dot: "bg-gray-500", label: "Note" },
  lab: { icon: FlaskConical, dot: "bg-purple-500", label: "Investigation" },
  imaging: { icon: Scan, dot: "bg-cyan-500", label: "Imaging" },
};

function fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-IE", { day: "numeric", month: "short" });
}

export default function CaseTimeline({ caseData }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadTimeline();
  }, [caseData.id]);

  const loadTimeline = async () => {
    try {
      const [notes, labs, photos] = await Promise.all([
        base44.entities.CaseNote.filter({ case_id: caseData.id }, "-created_date", 100).catch(() => []),
        base44.entities.LabResult.filter({ case_id: caseData.id }, "-collected_at", 50).catch(() => []),
        base44.entities.ClinicalPhoto.filter({ case_id: caseData.id }).catch(() => []),
      ]);

      const items = [];

      items.push({
        id: "referral-" + caseData.id,
        type: "referral",
        timestamp: caseData.created_date,
        title: "Referral Received",
        detail: caseData.presenting_complaint || caseData.referral_summary || "Case opened",
        author: caseData.referrer_name,
      });

      if (caseData.admission_date) {
        items.push({
          id: "admission-" + caseData.id,
          type: "admission",
          timestamp: caseData.admission_date,
          title: "Patient Admitted",
          detail: caseData.diagnosis || caseData.presenting_complaint || "",
          author: caseData.note_author_name,
        });
      }

      notes.forEach(n => {
        const cfg = MILESTONE_CONFIG[n.note_type] || MILESTONE_CONFIG.general;
        items.push({
          id: n.id,
          type: n.note_type || "review",
          timestamp: n.created_date,
          title: cfg.label + " Note",
          detail: n.content?.substring(0, 100) + (n.content?.length > 100 ? "…" : ""),
          author: n.author_name,
        });
      });

      labs.forEach(l => {
        items.push({
          id: l.id,
          type: "lab",
          timestamp: l.collected_at || l.created_date,
          title: `${l.test_type}: ${l.value}${l.unit ? " " + l.unit : ""}`,
          detail: "Blood investigation result",
        });
      });

      photos.forEach(p => {
        items.push({
          id: p.id,
          type: "imaging",
          timestamp: p.created_date,
          title: p.caption || (p.photo_type?.replace(/_/g, " ") || "Clinical photo"),
          detail: p.photo_type?.replace(/_/g, " "),
        });
      });

      items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setMilestones(items);
    } catch (err) {
      console.error("Timeline error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex-shrink-0 bg-sidebar/60 border-r border-sidebar-border overflow-hidden transition-all duration-300 ease-out hidden md:block"
      style={{ width: expanded ? "280px" : "44px" }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Header */}
      <div className="px-3 py-3 border-b border-sidebar-border flex items-center gap-2 h-[52px]">
        <Activity className="w-4 h-4 text-hive-gold flex-shrink-0" />
        {expanded && (
          <span className="text-xs font-bold text-hive-gold uppercase tracking-wider whitespace-nowrap animate-fade-in">
            Timeline
          </span>
        )}
      </div>

      {/* Timeline body */}
      <div className="py-2">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-4 h-4 border-2 border-hive-gold/30 border-t-hive-gold rounded-full animate-spin" />
          </div>
        ) : milestones.length === 0 ? (
          <div className="px-3 py-4">
            {!expanded && <div className="w-2 h-2 rounded-full bg-muted-foreground mx-auto" />}
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[21px] top-2 bottom-2 w-0.5 bg-sidebar-border" />

            <div className="space-y-0.5">
              {milestones.map((m) => {
                const config = MILESTONE_CONFIG[m.type] || MILESTONE_CONFIG.general;
                const Icon = config.icon;
                return (
                  <div key={m.id} className="relative flex items-start gap-2 px-1 py-1 hover:bg-sidebar-accent/40 rounded-r-lg transition-colors">
                    {/* Dot with icon */}
                    <div className={`relative z-10 flex items-center justify-center w-5 h-5 rounded-full ${config.dot} flex-shrink-0 ml-2 mt-0.5`}>
                      <Icon className="w-2.5 h-2.5 text-white" />
                    </div>

                    {/* Detail — only when expanded */}
                    {expanded && (
                      <div className="flex-1 min-w-0 pt-0.5 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] font-semibold text-sidebar-foreground truncate">{m.title}</p>
                          <span className="text-[9px] text-muted-foreground whitespace-nowrap ml-auto">{fmtTime(m.timestamp)}</span>
                        </div>
                        {m.detail && (
                          <p className="text-[10px] text-muted-foreground truncate leading-tight">{m.detail}</p>
                        )}
                        {m.author && (
                          <p className="text-[9px] text-muted-foreground/60 truncate">by {m.author}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}