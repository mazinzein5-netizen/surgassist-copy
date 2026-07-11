import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, Loader2, ChevronRight, BedDouble, X } from "lucide-react";

const DEPT_LABELS = { orthopaedics: "Orthopaedics", general_surgery: "General Surgery" };

export default function PatientHistory() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);

  useEffect(() => { loadPatients(); }, []);

  const loadPatients = async () => {
    try {
      const data = await base44.entities.Patient.list("-created_date", 100);
      setPatients(JSON.parse(JSON.stringify(data)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadPatientCases = async (patient) => {
    setSelectedPatient(patient);
    setLoadingCases(true);
    setCases([]);
    try {
      const mrn = patient.mrn;
      const results = mrn
        ? await base44.entities.CaseFile.filter({ patient_mrn: mrn }, "-created_date", 50).catch(() => [])
        : [];
      setCases(results);
    } catch (err) { console.error(err); }
    finally { setLoadingCases(false); }
  };

  const filtered = patients.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.mrn?.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Patients</h1>
        <p className="text-sm text-gray-500 mt-0.5">{patients.length} patients</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or MRN..."
          className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-500 text-sm">No patients found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const active = p.ward || p.bed_number;
            return (
              <button key={p.id} onClick={() => loadPatientCases(p)}
                className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                      {p.mrn && <span className="text-sm font-semibold text-gray-700">MRN: {p.mrn}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {(p.ward || p.bed_number) && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <BedDouble className="w-3.5 h-3.5" />
                          {p.ward || "—"}{p.bed_number ? ` · Bed ${p.bed_number}` : ""}
                        </span>
                      )}
                      {p.department && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          {DEPT_LABELS[p.department] || p.department}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`w-2.5 h-2.5 rounded-full ${active ? "bg-blue-500" : "bg-gray-300"}`} />
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected patient case files */}
      {selectedPatient && (
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900">{selectedPatient.name}</h2>
              <p className="text-sm text-gray-500">{selectedPatient.mrn || "No MRN"}</p>
            </div>
            <button onClick={() => setSelectedPatient(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          {loadingCases ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : cases.length === 0 ? (
            <p className="text-sm text-gray-500">No case files linked to this patient.</p>
          ) : (
            <div className="space-y-2">
              {cases.map(c => (
                <Link key={c.id} to={`/cases/${c.id}`}
                  className="block bg-gray-50 border border-gray-200 rounded-lg p-3 hover:border-gray-400 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {c.presenting_complaint || c.referral_summary || "No complaint"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">{c.status?.replace(/_/g, " ")}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}