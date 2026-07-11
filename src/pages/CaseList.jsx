import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import HexBadge from "@/components/HexBadge";
import { formatTimestamp, timeAgo } from "@/lib/formatDate";
import { FilePlus2, Search } from "lucide-react";

export default function CaseList() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadCases(); }, []);

  const loadCases = async () => {
    try {
      const data = await base44.entities.CaseFile.filter({}, "-created_date", 100);
      setCases(data);
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
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">Referrals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{cases.length} total</p>
        </div>
        <Link to="/new-referral" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background font-medium text-sm hover:opacity-80">
          <FilePlus2 className="w-4 h-4" />
          <span className="hidden sm:inline">New Referral</span>
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, MRN, or complaint..."
          className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-border border-t-foreground rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No referrals found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <Link
              key={c.id}
              to={`/cases/${c.id}`}
              className="block bg-card border border-border rounded-lg p-4 hover:border-foreground/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground truncate">{c.patient_name || "Unknown"}</p>
                    {c.patient_mrn && <span className="text-sm text-muted-foreground">· MRN: {c.patient_mrn}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {c.presenting_complaint || c.referral_summary || "No complaint recorded"}
                  </p>
                </div>
                <HexBadge status={c.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{timeAgo(c.created_date)} · {formatTimestamp(c.created_date)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}