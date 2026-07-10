import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Loader2, Users, FileText } from "lucide-react";
import HandoverExportMenu from "@/components/HandoverExportMenu";

export default function Handover() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState({});

  useEffect(() => { loadCases(); }, []);

  const loadCases = async () => {
    try {
      const data = await base44.entities.CaseFile.filter({ status: { $in: ["accepted", "clerking", "investigations", "admitted"] } }, "-created_date", 50);
      setCases(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const grouped = cases.reduce((acc, c) => {
    const group = c.status === "admitted" ? "Post-op/Admitted" : c.status === "clerking" ? "For Review" : c.status === "investigations" ? "Awaiting Investigations" : "New/Pre-op";
    if (!acc[group]) acc[group] = [];
    acc[group].push(c);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">End-of-Shift Handover</h1>
          <p className="text-sm text-muted-foreground mt-0.5">ISBAR summary · {cases.length} active cases</p>
        </div>
        <HandoverExportMenu grouped={grouped} caseCount={cases.length} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-border border-t-hive-gold rounded-full animate-spin" />
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No active cases for handover.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, groupCases]) => (
            <div key={group}>
              <h2 className="text-sm font-semibold text-hive-gold uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 hex-clip bg-hive-gold" />
                {group} ({groupCases.length})
              </h2>
              <div className="space-y-2">
                {groupCases.map(c => (
                  <div key={c.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{c.patient_name}</h3>
                        <p className="text-xs text-muted-foreground">MRN: {c.patient_mrn || "N/A"} · {c.department?.replace("_", " ")}</p>
                      </div>
                    </div>
                    <div className="bg-background rounded-lg p-3 mt-2 border border-border/50">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">ISBAR</p>
                      <div className="text-xs text-foreground space-y-1">
                        <p><span className="font-semibold text-hive-gold">I:</span> {c.patient_name}, MRN: {c.patient_mrn || "N/A"}</p>
                        <p><span className="font-semibold text-hive-gold">S:</span> {c.presenting_complaint || c.referral_summary?.slice(0, 100) || "N/A"}</p>
                        <p><span className="font-semibold text-hive-gold">B:</span> Triage: {c.triage_decision?.toUpperCase() || "N/A"}. {c.triage_guideline || ""}</p>
                        <p><span className="font-semibold text-hive-gold">A:</span> {c.treatment_plan?.slice(0, 150) || "Assessment in progress"}</p>
                        <p><span className="font-semibold text-hive-gold">R:</span> {c.admission_recommendation?.slice(0, 100) || "Continue current management"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}