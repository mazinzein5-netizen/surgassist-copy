import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import InpatientCard from "@/components/InpatientCard";
import PrintPlanNote from "@/components/PrintPlanNote";
import BloodTrendChart, { LAB_RANGES, getAbnormalStatus } from "@/components/BloodTrendChart";
import { Activity, AlertTriangle, RefreshCw, ShieldCheck, Search, BedDouble, TrendingUp, ChevronDown, Building2 } from "lucide-react";

const DEPT_LABELS = { orthopaedics: "Orthopaedics", general_surgery: "General Surgery" };

export default function InpatientMonitor() {
  const { user } = useAuth();
  const [view, setView] = useState("patients"); // patients | trends
  const [cases, setCases] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [printCase, setPrintCase] = useState(null);

  useEffect(() => {
    loadInpatients();
    const interval = setInterval(loadInpatients, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadInpatients = async () => {
    try {
      const data = await base44.entities.CaseFile.filter({ status: "admitted" }, "-updated_date", 100);
      setCases(data);
      setLastUpdated(new Date());
      if (!selectedCaseId && data.length > 0) setSelectedCaseId(data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLabResults = async (caseId) => {
    if (!caseId) return;
    try {
      const data = await base44.entities.LabResult.filter({ case_id: caseId }, "collected_at", 200);
      setLabResults(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (view === "trends" && selectedCaseId) {
      loadLabResults(selectedCaseId);
    }
  }, [view, selectedCaseId]);

  const filteredCases = useMemo(() => {
    let result = cases;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => c.patient_name?.toLowerCase().includes(q) || c.patient_mrn?.toLowerCase().includes(q));
    }
    if (filter !== "all") {
      result = result.filter(c => {
        const score = c.inews_score;
        if (filter === "critical") return score != null && score >= 7;
        if (filter === "warning") return score != null && score >= 3 && score < 7;
        if (filter === "stable") return score == null || score < 3;
        return true;
      });
    }
    return [...result].sort((a, b) => (b.inews_score || 0) - (a.inews_score || 0));
  }, [cases, search, filter]);

  const stats = useMemo(() => {
    const critical = cases.filter(c => c.inews_score != null && c.inews_score >= 7).length;
    const warning = cases.filter(c => c.inews_score != null && c.inews_score >= 3 && c.inews_score < 7).length;
    const stable = cases.filter(c => c.inews_score == null || c.inews_score < 3).length;
    return { total: cases.length, critical, warning, stable };
  }, [cases]);

  // Group lab results by test type for the selected patient
  const trendData = useMemo(() => {
    const grouped = {};
    for (const r of labResults) {
      if (!grouped[r.test_type]) grouped[r.test_type] = [];
      grouped[r.test_type].push(r);
    }
    return grouped;
  }, [labResults]);

  // Abnormal summary for the selected patient
  const abnormalSummary = useMemo(() => {
    const flags = [];
    for (const [testType, results] of Object.entries(trendData)) {
      if (!results.length) continue;
      const latest = [...results].sort((a, b) => new Date(b.collected_at) - new Date(a.collected_at))[0];
      const status = getAbnormalStatus(testType, latest.value);
      if (status !== "normal") {
        flags.push({ testType, value: latest.value, status, label: LAB_RANGES[testType]?.label || testType });
      }
    }
    return flags;
  }, [trendData]);

  // Group filtered patients by ward, sorted by INEWS score within each group
  const wardGroups = useMemo(() => {
    const grouped = {};
    for (const c of filteredCases) {
      const ward = c.ward?.trim() || "Unassigned Ward";
      if (!grouped[ward]) grouped[ward] = [];
      grouped[ward].push(c);
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => {
        if (a === "Unassigned Ward") return 1;
        if (b === "Unassigned Ward") return -1;
        return a.localeCompare(b);
      })
      .map(([ward, patients]) => ({
        ward,
        patients: [...patients].sort((a, b) => (b.inews_score || 0) - (a.inews_score || 0)),
      }));
  }, [filteredCases]);

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BedDouble className="w-5 h-5 text-hive-gold" />
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Inpatient Monitor</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            24/7 surveillance · {DEPT_LABELS[user?.department] || "Surgery"} · {user?.hospital || "HSE Hospital"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Updated {lastUpdated.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button onClick={loadInpatients} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Admitted" value={stats.total} icon={BedDouble} color="text-hive-gold" />
        <StatCard label="Critical (INEWS ≥7)" value={stats.critical} icon={AlertTriangle} color="text-destructive" />
        <StatCard label="Warning (3–6)" value={stats.warning} icon={Activity} color="text-warning" />
        <StatCard label="Stable (<3)" value={stats.stable} icon={ShieldCheck} color="text-success" />
      </div>

      {/* View toggle */}
      <div className="flex gap-1.5 bg-card border border-border rounded-lg p-1 mb-5 w-fit">
        <button onClick={() => setView("patients")} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "patients" ? "bg-hive-gold/15 text-hive-gold" : "text-muted-foreground hover:text-foreground"}`}>
          <BedDouble className="w-3.5 h-3.5 inline mr-1.5" />
          Patients
        </button>
        <button onClick={() => setView("trends")} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "trends" ? "bg-hive-gold/15 text-hive-gold" : "text-muted-foreground hover:text-foreground"}`}>
          <TrendingUp className="w-3.5 h-3.5 inline mr-1.5" />
          Blood Trends
        </button>
      </div>

      {/* Patients grid view */}
      {view === "patients" && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search by name or MRN..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50" />
            </div>
            <div className="flex gap-1.5 bg-card border border-border rounded-lg p-1">
              {[{ key: "all", label: "All" }, { key: "critical", label: "Critical" }, { key: "warning", label: "Warning" }, { key: "stable", label: "Stable" }].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f.key ? "bg-hive-gold/15 text-hive-gold" : "text-muted-foreground hover:text-foreground"}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-border border-t-hive-gold rounded-full animate-spin" />
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <BedDouble className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">{cases.length === 0 ? "No admitted patients currently being monitored." : "No patients match your filter."}</p>
              {cases.length === 0 && <Link to="/new-referral" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-hive-gold text-hive-gold-foreground font-medium text-sm hover:bg-hive-gold/90">Process New Admission</Link>}
            </div>
          ) : (
            <div className="space-y-6">
              {wardGroups.map(({ ward, patients }) => (
                <div key={ward}>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-hive-gold" />
                    <h3 className="text-sm font-bold text-foreground">{ward}</h3>
                    <span className="text-xs text-muted-foreground">{patients.length} patient{patients.length !== 1 ? "s" : ""}</span>
                    {patients.filter(c => c.inews_score != null && c.inews_score >= 7).length > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive/15 text-destructive">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {patients.filter(c => c.inews_score != null && c.inews_score >= 7).length} critical
                      </span>
                    )}
                    {patients.filter(c => c.inews_score != null && c.inews_score >= 3 && c.inews_score < 7).length > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-warning/15 text-warning">
                        {patients.filter(c => c.inews_score != null && c.inews_score >= 3 && c.inews_score < 7).length} warning
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {patients.map(c => <InpatientCard key={c.id} caseFile={c} onPrint={setPrintCase} />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Blood Trends view */}
      {view === "trends" && (
        <div className="space-y-4">
          {/* Patient selector */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground block mb-1">Select Patient</label>
                <div className="relative">
                  <select
                    value={selectedCaseId || ""}
                    onChange={e => setSelectedCaseId(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:border-hive-gold/50 appearance-none"
                  >
                    {cases.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.patient_name || "Unknown"} — MRN: {c.patient_mrn || "—"}
                        {c.inews_score != null ? ` (INEWS ${c.inews_score})` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              {selectedCase && (
                <Link to={`/cases/${selectedCase.id}`} className="sm:self-end px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 text-center">
                  View Case File
                </Link>
              )}
            </div>
          </div>

          {/* Abnormal summary banner */}
          {abnormalSummary.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <h3 className="font-semibold text-destructive text-sm">Abnormal Findings — Requires Review</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {abnormalSummary.map(f => (
                  <span key={f.testType} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${f.status === "critical" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}`}>
                    {f.label}: {f.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Trend charts */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-border border-t-hive-gold rounded-full animate-spin" />
            </div>
          ) : Object.keys(trendData).length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No blood results recorded for this patient yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {Object.entries(trendData).map(([testType, data]) => (
                <BloodTrendChart key={testType} testType={testType} data={data} />
              ))}
            </div>
          )}
        </div>
      )}

      {printCase && (
        <PrintPlanNote caseData={printCase} onClose={() => setPrintCase(null)} onUpdate={loadInpatients} />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}