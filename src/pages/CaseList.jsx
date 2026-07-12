import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import StatusPill from "@/components/StatusPill";
import { getStage, formatTimestamp, timeAgo } from "@/lib/workflow";
import { FilePlus2, Search, ChevronRight, Check, ClipboardCheck, BedDouble, Pencil, UserCog } from "lucide-react";
import InpatientStickerEditor from "@/components/InpatientStickerEditor";

export default function CaseList() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("active");
  const [editingCase, setEditingCase] = useState(null);

  useEffect(() => { loadCases(); }, []);

  const loadCases = async () => {
    try {
      const data = await base44.entities.CaseFile.filter({}, "-created_date", 100);
      setCases(JSON.parse(JSON.stringify(data)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const isInpatient = (c) => ["admitted", "inews_consult", "discharge_ready"].includes(c.status);

  const filtered = cases.filter(c => {
    // Tab filter
    if (tab === "inpatients" && !isInpatient(c)) return false;
    if (tab === "active" && isInpatient(c)) return false;
    // Search filter
    if (!search) return true;
    const q = search.toLowerCase();
    return c.patient_name?.toLowerCase().includes(q) ||
      c.patient_mrn?.toLowerCase().includes(q) ||
      c.presenting_complaint?.toLowerCase().includes(q);
  });

  const inpatientCount = cases.filter(isInpatient).length;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Referrals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{cases.length} total · {inpatientCount} inpatient{inpatientCount !== 1 ? "s" : ""}</p>
        </div>
        <Link to="/new-referral" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-hive-gold text-hive-navy font-semibold text-sm hover:bg-hive-gold/90">
          <FilePlus2 className="w-4 h-4" /> New Referral
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-border">
        <button onClick={() => setTab("active")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === "active" ? "border-hive-gold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          Active Referrals
          <span className="ml-1.5 text-xs text-muted-foreground">({cases.length - inpatientCount})</span>
        </button>
        <button onClick={() => setTab("inpatients")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === "inpatients" ? "border-hive-gold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <BedDouble className="w-3.5 h-3.5 inline mr-1" />
          Inpatient List
          <span className="ml-1.5 text-xs text-muted-foreground">({inpatientCount})</span>
        </button>
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
                    {c.treatment_plan && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <ClipboardCheck className="w-3 h-3 text-hive-gold flex-shrink-0" />
                        <p className="text-xs text-hive-gold font-medium truncate">
                          {c.treatment_plan.split("\n")[0].slice(0, 80)}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingCase(c); }}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer hover:ring-2 hover:ring-hive-gold/40 transition-all ${
                          c.department === "orthopaedics"
                            ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                            : c.department === "general_surgery"
                            ? "bg-teal-500/15 text-teal-400 border border-teal-500/20"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                        title="Edit department, ward, bed, consultant"
                      >
                        {c.department === "orthopaedics" ? "Orthopaedics" : c.department === "general_surgery" ? "General Surgery" : c.department?.replace("_", " ") || "Unknown"}
                        <Pencil className="w-2.5 h-2.5 opacity-60" />
                      </button>
                      <StatusPill caseData={c} />
                      {isInpatient(c) && c.consultant_name && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                          <UserCog className="w-3 h-3" />
                          {c.consultant_name}
                        </span>
                      )}
                      {isInpatient(c) && (c.ward || c.bed_number) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-hive-gold/15 text-hive-gold border border-hive-gold/30">
                          <BedDouble className="w-3 h-3" />
                          {c.ward || "Ward"}{c.bed_number ? ` · Bed ${c.bed_number}` : ""}
                        </span>
                      )}
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
                        <Check className="w-3 h-3" /> Discharged
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {editingCase && (
        <InpatientStickerEditor
          caseData={editingCase}
          onClose={() => setEditingCase(null)}
          onUpdated={loadCases}
        />
      )}
    </div>
  );
}