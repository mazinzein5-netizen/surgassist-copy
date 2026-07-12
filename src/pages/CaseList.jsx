import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CaseCard from "@/components/CaseCard";
import InpatientStickerEditor from "@/components/InpatientStickerEditor";
import { groupInpatients, INPATIENT_GROUP_CONFIG } from "@/lib/referralStatus";
import { FilePlus2, Search, BedDouble, Scissors, Clock, Heart, Check } from "lucide-react";

const GROUP_ICONS = {
  theatre: Scissors,
  listed: Clock,
  icu: Heart,
  ward: BedDouble,
};

export default function CaseList() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("referrals");
  const [dischargeSubTab, setDischargeSubTab] = useState("opd");
  const [editingCase, setEditingCase] = useState(null);

  useEffect(() => { loadCases(); }, []);

  const loadCases = async () => {
    try {
      const data = await base44.entities.CaseFile.filter({}, "-created_date", 200);
      setCases(JSON.parse(JSON.stringify(data)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const isInpatient = (c) => ["admitted", "inews_consult", "discharge_ready"].includes(c.status);
  const isDischarged = (c) => c.status === "discharged" || c.status === "declined";

  // Categorize
  const referrals = cases.filter(c => !isInpatient(c) && !isDischarged(c));
  const inpatients = cases.filter(isInpatient);
  const dischargedOpd = cases.filter(c => c.status === "discharged" && c.discharge_pathway === "opd_followup");
  const dischargedTci = cases.filter(c => c.status === "discharged" && c.discharge_pathway === "tci");
  const dischargedHome = cases.filter(c => c.status === "discharged" && (c.discharge_pathway === "no_followup" || !c.discharge_pathway));
  const declined = cases.filter(c => c.status === "declined");

  const matchSearch = (c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.patient_name?.toLowerCase().includes(q) ||
      c.patient_mrn?.toLowerCase().includes(q) ||
      c.presenting_complaint?.toLowerCase().includes(q);
  };

  const filteredReferrals = referrals.filter(matchSearch);
  const filteredInpatients = inpatients.filter(matchSearch);
  const inpatientGroups = groupInpatients(filteredInpatients);

  const currentDischargedList = dischargeSubTab === "opd" ? dischargedOpd :
    dischargeSubTab === "tci" ? dischargedTci :
    [...dischargedHome, ...declined];
  const filteredDischarged = currentDischargedList.filter(matchSearch);

  const totalDischarged = dischargedOpd.length + dischargedTci.length + dischargedHome.length + declined.length;
  const headings = { referrals: "Active Referrals", inpatients: "Inpatient Board", discharged: "Discharged Patients" };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">{headings[tab]}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {referrals.length} referrals · {inpatients.length} inpatients · {totalDischarged} discharged
          </p>
        </div>
        <Link to="/new-referral" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-hive-gold text-hive-navy font-semibold text-sm hover:bg-hive-gold/90">
          <FilePlus2 className="w-4 h-4" /> New Referral
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-border overflow-x-auto">
        <button onClick={() => setTab("referrals")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${tab === "referrals" ? "border-hive-gold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          Referrals
          <span className="ml-1.5 text-xs text-muted-foreground">({referrals.length})</span>
        </button>
        <button onClick={() => setTab("inpatients")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${tab === "inpatients" ? "border-hive-gold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <BedDouble className="w-3.5 h-3.5 inline mr-1" />
          Inpatients
          <span className="ml-1.5 text-xs text-muted-foreground">({inpatients.length})</span>
        </button>
        <button onClick={() => setTab("discharged")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${tab === "discharged" ? "border-hive-gold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <Check className="w-3.5 h-3.5 inline mr-1" />
          Discharged
          <span className="ml-1.5 text-xs text-muted-foreground">({totalDischarged})</span>
        </button>
      </div>

      {/* Discharge sub-tabs */}
      {tab === "discharged" && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {[
            { key: "opd", label: "OPD Follow-up", count: dischargedOpd.length },
            { key: "tci", label: "TCI — To Come In", count: dischargedTci.length },
            { key: "home", label: "Home / GP", count: dischargedHome.length + declined.length },
          ].map(sub => (
            <button key={sub.key} onClick={() => setDischargeSubTab(sub.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${dischargeSubTab === sub.key ? "bg-hive-gold text-hive-navy" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {sub.label} ({sub.count})
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, MRN, or complaint..."
          className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50" />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-border border-t-hive-gold rounded-full animate-spin" />
        </div>
      ) : tab === "referrals" ? (
        filteredReferrals.length === 0 ? (
          <EmptyState message="No active referrals." />
        ) : (
          <div className="space-y-2">
            {filteredReferrals.map(c => (
              <CaseCard key={c.id} caseData={c} onEdit={setEditingCase} mode="referral" />
            ))}
          </div>
        )
      ) : tab === "inpatients" ? (
        filteredInpatients.length === 0 ? (
          <EmptyState message="No inpatients currently admitted." />
        ) : (
          <div className="space-y-6">
            {["theatre", "listed", "icu"].map(groupKey => {
              const groupCases = inpatientGroups[groupKey];
              if (!groupCases || groupCases.length === 0) return null;
              const config = INPATIENT_GROUP_CONFIG[groupKey];
              const Icon = GROUP_ICONS[groupKey];
              return (
                <InpatientGroupSection key={groupKey} icon={Icon} label={config.label} color={config.color} cases={groupCases} onEdit={setEditingCase} />
              );
            })}
            {Object.entries(inpatientGroups.ward || {}).map(([wardName, wardCases]) => (
              <InpatientGroupSection key={wardName} icon={BedDouble} label={wardName} color="#3B82F6" cases={wardCases} onEdit={setEditingCase} />
            ))}
          </div>
        )
      ) : (
        filteredDischarged.length === 0 ? (
          <EmptyState message="No patients in this list." />
        ) : (
          <div className="space-y-2">
            {filteredDischarged.map(c => (
              <CaseCard key={c.id} caseData={c} onEdit={setEditingCase} mode="discharged" />
            ))}
          </div>
        )
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

function EmptyState({ message }) {
  return (
    <div className="bg-card border border-border rounded-xl p-12 text-center">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

function InpatientGroupSection({ icon: Icon, label, color, cases, onEdit }) {
  return (
    <div>
      <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color }}>
        <Icon className="w-4 h-4" />
        {label}
        <span className="text-xs font-normal text-muted-foreground">({cases.length})</span>
      </h3>
      <div className="space-y-2 ml-2 border-l-2 pl-3" style={{ borderColor: `${color}30` }}>
        {cases.map(c => (
          <CaseCard key={c.id} caseData={c} onEdit={onEdit} mode="inpatient" />
        ))}
      </div>
    </div>
  );
}