import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import StatusPill from "@/components/StatusPill";
import { getStage, formatTimestamp, timeAgo } from "@/lib/workflow";
import { FilePlus2, Search, ChevronRight, Check } from "lucide-react";

export default function CaseList() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadCases(); }, []);

  const loadCases = async () => {
    try {
      const data = await base44.entities.CaseFile.filter({}, "-created_date", 100);
      setCases(JSON.parse(JSON.stringify(data)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = cases.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.patient_name?.toLowerCase().includes(q) ||
      c.patient_mrn?.toLowerCase().includes(q) ||
      c.presenting_complaint?.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Referrals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{cases.length} total</p>
        </div>
        <Link to="/new-referral" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-hive-gold text-hive-navy font-semibold text-sm hover:bg-hive-gold/90">
          <FilePlus2 className="w-4 h-4" /> New Referral
        </Link>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, MRN, or complaint..."
          className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-border border-t-hive-gold rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground text-sm">No referrals found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const stage = getStage(c);
            return (
              <Link key={c.id} to={`/cases/${c.id}`}
                className="block bg-card border border-border rounded-xl p-4 hover:border-hive-gold/40 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate">{c.patient_name || "Unknown"}</p>
                      {c.patient_mrn && <span className="text-sm font-semibold text-muted-foreground">MRN: {c.patient_mrn}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {c.presenting_complaint || c.referral_summary || "No complaint recorded"}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        c.department === "orthopaedics"
                          ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                          : c.department === "general_surgery"
                          ? "bg-teal-500/15 text-teal-400 border border-teal-500/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}>
                        {c.department === "orthopaedics" ? "Orthopaedics" : c.department === "general_surgery" ? "General Surgery" : c.department?.replace("_", " ") || "Unknown"}
                      </span>
                      <StatusPill caseData={c} />
                      <span className="text-xs text-muted-foreground">{timeAgo(c.created_date)}</span>
                      <span className="text-xs text-muted-foreground">{formatTimestamp(c.created_date)}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {stage < 3 ? (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        stage === 0 ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"
                      }`}>
                        {stage === 0 ? "Triage" : stage === 1 ? "Review" : "Plan"}
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/15 text-green-400">
                        <Check className="w-3 h-3" /> Done
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}