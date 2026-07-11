import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import HexBadge from "@/components/HexBadge";
import { formatTimestamp } from "@/lib/formatDate";
import { Search, ChevronRight } from "lucide-react";

const DEPT_LABELS = { orthopaedics: "Orthopaedics", general_surgery: "General Surgery" };

export default function PatientHistory() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);

  useEffect(() => { loadPatients(); }, []);

  const loadPatients = async () => {
    try {
      const data = await base44.entities.Patient.list("-created_date", 100);
      setPatients(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSelect = async (patient) => {
    if (selected?.id === patient.id) { setSelected(null); return; }
    setSelected(patient);
    setLoadingCases(true);
    setCases([]);
    try {
      const caseData = await base44.entities.CaseFile.filter({ patient_mrn: patient.mrn }, "-created_date", 50).catch(() => []);
      setCases(caseData);
    } catch { setCases([]); }
    finally { setLoadingCases(false); }
  };

  const filtered = patients.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.mrn?.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">Patients</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{patients.length} total</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or MRN..."
          className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-border border-t-foreground rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No patients found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const isActive = p.bed_number || p.ward;
            return (
              <div key={p.id}>
                <button
                  onClick={() => handleSelect(p)}
                  className="w-full flex items-center justify-between bg-card border border-border rounded-lg p-4 hover:border-foreground/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? "bg-[#2563EB]" : "bg-muted-foreground/30"}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{p.name || "Unknown"}</p>
                        {p.mrn && <span className="text-sm text-muted-foreground">· MRN: {p.mrn}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {p.ward || "No ward"} · {p.bed_number || "No bed"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {p.department && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                        {DEPT_LABELS[p.department] || p.department}
                      </span>
                    )}
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${selected?.id === p.id ? "rotate-90" : ""}`} />
                  </div>
                </button>

                {selected?.id === p.id && (
                  <div className="bg-card border border-border rounded-lg p-4 mt-1 mb-2 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <InfoField label="DOB" value={selected.dob ? new Date(selected.dob).toLocaleDateString("en-IE") : "—"} />
                      <InfoField label="Gender" value={selected.gender ? selected.gender.charAt(0).toUpperCase() + selected.gender.slice(1) : "—"} />
                      <InfoField label="Hospital" value={selected.hospital || "—"} />
                      <InfoField label="Consultant" value={selected.consultant_name || "—"} />
                    </div>
                    {selected.known_allergies && (
                      <div>
                        <p className="text-xs text-muted-foreground">Allergies</p>
                        <p className="text-sm text-[#DC2626]">{selected.known_allergies}</p>
                      </div>
                    )}
                    {selected.pmh_summary && (
                      <div>
                        <p className="text-xs text-muted-foreground">Past Medical History</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{selected.pmh_summary}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Case Files</p>
                      {loadingCases ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                      ) : cases.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No previous cases.</p>
                      ) : (
                        <div className="space-y-1">
                          {cases.map(c => (
                            <Link
                              key={c.id}
                              to={`/cases/${c.id}`}
                              className="flex items-center justify-between bg-muted/50 rounded-lg p-3 hover:bg-muted transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-foreground truncate">{c.presenting_complaint || "No complaint"}</p>
                                <p className="text-xs text-muted-foreground">{formatTimestamp(c.created_date)}</p>
                              </div>
                              <HexBadge status={c.status} />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}