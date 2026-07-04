import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import HexBadge from "@/components/HexBadge";
import { FilePlus2, Search, Filter, ChevronRight } from "lucide-react";

const DEPT_LABELS = { orthopaedics: "Orthopaedics", general_surgery: "General Surgery" };

export default function CaseList() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const data = await base44.entities.CaseFile.filter({}, "-created_date", 100);
      setCases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = cases.filter(c => {
    const matchesSearch = !search ||
      c.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.patient_mrn?.toLowerCase().includes(search.toLowerCase()) ||
      c.presenting_complaint?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "accepted", label: "Accepted" },
    { value: "triage", label: "Triaging" },
    { value: "clerking", label: "Clerking" },
    { value: "admitted", label: "Admitted" },
    { value: "discharged", label: "Discharged" },
    { value: "declined", label: "Declined" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">My Cases</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{cases.length} total cases</p>
        </div>
        <Link to="/new-referral" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-hive-gold text-hive-gold-foreground font-medium text-sm hover:bg-hive-gold/90 transition-colors">
          <FilePlus2 className="w-4 h-4" />
          <span className="hidden sm:inline">New Referral</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name, MRN, or complaint..."
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === opt.value ? "bg-hive-gold/15 text-hive-gold border border-hive-gold/30" : "bg-card text-muted-foreground border border-border"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cases */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-border border-t-hive-gold rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground text-sm">No cases found matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center justify-between bg-card border border-border rounded-lg p-4 hover:border-hive-gold/30 transition-colors group">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 hex-clip bg-hive-gold/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-hive-gold font-bold text-sm">{c.patient_name?.charAt(0)?.toUpperCase() || "?"}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground text-sm truncate">{c.patient_name || "Unknown"}</p>
                    {c.patient_mrn && <span className="text-xs text-muted-foreground">MRN: {c.patient_mrn}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {c.presenting_complaint || c.referral_summary || "No summary available"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">{DEPT_LABELS[c.department]}</span>
                    {c.triage_decision && c.triage_decision !== "pending" && (
                      <span className="text-[10px] text-muted-foreground">· {c.triage_decision.toUpperCase()}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <HexBadge status={c.status} />
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {new Date(c.created_date).toLocaleDateString("en-IE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}