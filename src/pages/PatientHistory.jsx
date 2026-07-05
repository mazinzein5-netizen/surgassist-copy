import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AIBadge from "@/components/AIBadge";
import { Search, Loader2, FileText, FlaskConical, Camera, Activity, Clock, User, ChevronRight, AlertTriangle } from "lucide-react";

export default function PatientHistory() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [patient, setPatient] = useState(null);
  const [cases, setCases] = useState([]);
  const [labs, setLabs] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setHasSearched(true);
    setPatient(null);
    setCases([]);
    setLabs([]);
    setPhotos([]);
    try {
      const patients = await base44.entities.Patient.list("-created_date", 50);
      const q = query.toLowerCase().trim();
      const found = patients.find(p =>
        (p.mrn && p.mrn.toLowerCase().includes(q)) ||
        (p.name && p.name.toLowerCase().includes(q))
      );

      if (!found) {
        setSearching(false);
        return;
      }

      setPatient(found);

      const [caseResults, labResults, photoResults] = await Promise.all([
        base44.entities.CaseFile.filter({ patient_mrn: found.mrn }, "-created_date", 50).catch(() => []),
        base44.entities.LabResult.filter({ patient_mrn: found.mrn }, "-created_date", 50).catch(() => []),
        base44.entities.ClinicalPhoto.list("-created_date", 50).catch(() => []),
      ]);

      const caseIds = caseResults.map(c => c.id);
      const patientPhotos = photoResults.filter(p => caseIds.includes(p.case_id));

      setCases(caseResults);
      setLabs(labResults);
      setPhotos(patientPhotos);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-5 h-5 text-hive-gold" />
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Patient Cloud Memory</h1>
        </div>
        <p className="text-sm text-muted-foreground">Search by MRN or name to retrieve full cross-visit history — cases, labs, imaging, and notes</p>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
            placeholder="Enter MRN or patient name..."
            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-hive-gold text-hive-gold-foreground font-medium text-sm hover:bg-hive-gold/90 disabled:opacity-50"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </div>

      {hasSearched && !searching && !patient && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No patient found matching "{query}".</p>
          <p className="text-xs text-muted-foreground mt-1">This may be a new patient with no previous visits recorded.</p>
        </div>
      )}

      {patient && (
        <div className="space-y-4">
          {/* Patient Summary */}
          <div className="bg-card border-2 border-hive-gold/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-foreground">{patient.name}</h2>
              <AIBadge />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoItem label="MRN" value={patient.mrn || "—"} />
              <InfoItem label="DOB" value={patient.dob ? new Date(patient.dob).toLocaleDateString("en-IE") : "—"} />
              <InfoItem label="Gender" value={patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : "—"} />
              <InfoItem label="Hospital" value={patient.hospital || "—"} />
              <InfoItem label="Specialty" value={patient.specialty || "—"} />
              <InfoItem label="Consultant" value={patient.consultant_name || "—"} />
              <InfoItem label="Ward" value={patient.ward || "—"} />
              <InfoItem label="Bed" value={patient.bed_number || "—"} />
            </div>

            {patient.pmh_summary && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Past Medical History (Compiled)</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{patient.pmh_summary}</p>
              </div>
            )}
            {patient.known_allergies && (
              <div className="mt-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Allergies</p>
                <p className="text-sm text-destructive">{patient.known_allergies}</p>
              </div>
            )}
            {patient.medication_history && (
              <div className="mt-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Medication History (Compiled)</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{patient.medication_history}</p>
              </div>
            )}
            {patient.social_history && (
              <div className="mt-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Social History</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{patient.social_history}</p>
              </div>
            )}
          </div>

          {/* Visit History */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-hive-gold" />
              Visit History ({cases.length} {cases.length === 1 ? "visit" : "visits"})
            </h3>
            <div className="space-y-2">
              {cases.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-card border border-border rounded-lg p-4">No previous visits recorded.</p>
              ) : (
                cases.map(c => (
                  <Link
                    key={c.id}
                    to={`/cases/${c.id}`}
                    className="block bg-card border border-border rounded-xl p-3 hover:border-hive-gold/30 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            c.status === "discharged" ? "bg-success/15 text-success" :
                            c.status === "inews_consult" ? "bg-destructive/15 text-destructive" :
                            c.status === "admitted" ? "bg-accent/15 text-accent" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {c.status?.replace(/_/g, " ")}
                          </span>
                          {c.specialty && (
                            <span className="text-[10px] text-muted-foreground">{c.specialty}</span>
                          )}
                        </div>
                        <p className="text-sm text-foreground font-medium truncate">{c.presenting_complaint || c.referral_summary || "No complaint recorded"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(c.created_date).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}
                          {c.consultant_name && ` · Consultant: ${c.consultant_name}`}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-hive-gold flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Lab Results Summary */}
          {labs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-hive-gold" />
                Historical Lab Results ({labs.length})
              </h3>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="text-left px-3 py-2 font-medium">Date</th>
                      <th className="text-left px-3 py-2 font-medium">Test</th>
                      <th className="text-left px-3 py-2 font-medium">Value</th>
                      <th className="text-left px-3 py-2 font-medium">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labs.slice(0, 15).map((l, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="px-3 py-2 text-muted-foreground text-xs">{new Date(l.collected_at).toLocaleDateString("en-IE")}</td>
                        <td className="px-3 py-2 text-foreground font-medium capitalize">{l.test_type}</td>
                        <td className="px-3 py-2 text-foreground">{l.value}</td>
                        <td className="px-3 py-2 text-muted-foreground">{l.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Clinical Photos */}
          {photos.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4 text-hive-gold" />
                Clinical Photos ({photos.length})
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {photos.slice(0, 10).map(p => (
                  <div key={p.id} className="relative">
                    <img src={p.photo_url} alt={p.photo_type} className="w-full h-24 rounded-lg object-cover border border-border" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm rounded-b-lg px-1 py-0.5">
                      <span className="text-[9px] text-white capitalize">{p.photo_type.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}