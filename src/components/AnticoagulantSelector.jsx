import React from "react";
import { Check } from "lucide-react";

const ANTICOAGULANT_GROUPS = [
  {
    category: "Antiplatelet",
    drugs: [
      "Aspirin 75mg OD",
      "Aspirin 150mg OD",
      "Clopidogrel 75mg OD",
      "Clopidogrel 300mg loading",
      "Ticagrelor 90mg BD",
      "Dual antiplatelet therapy",
    ],
  },
  {
    category: "DOAC",
    drugs: [
      "Apixaban 2.5mg BD",
      "Apixaban 5mg BD",
      "Apixaban 10mg BD",
      "Rivaroxaban 15mg OD",
      "Rivaroxaban 20mg OD",
      "Dabigatran 110mg BD",
      "Dabigatran 150mg BD",
      "Edoxaban 30mg OD",
      "Edoxaban 60mg OD",
    ],
  },
  {
    category: "Vitamin K Antagonist",
    drugs: [
      "Warfarin (variable dose)",
    ],
  },
  {
    category: "LMWH",
    drugs: [
      "Enoxaparin 40mg OD (prophylaxis)",
      "Enoxaparin 1mg/kg BD (treatment)",
      "Tinzaparin 4500IU OD",
      "Dalteparin 5000IU OD",
    ],
  },
];

const ALL_PRESETS = ANTICOAGULANT_GROUPS.flatMap(g => g.drugs);

export function getAnticoagulantCategory(drug) {
  for (const group of ANTICOAGULANT_GROUPS) {
    if (group.drugs.includes(drug)) return group.category;
  }
  return "Other";
}

export function formatAnticoagulants(meds) {
  if (!meds || meds.length === 0) return null;
  const grouped = {};
  for (const drug of meds) {
    const cat = getAnticoagulantCategory(drug);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(drug);
  }
  const parts = Object.entries(grouped).map(([cat, drugs]) =>
    `${cat} — ${drugs.join(", ")}`
  );
  return `On anticoagulation: ${parts.join("; ")}`;
}

export default function AnticoagulantSelector({ selected = [], onChange }) {
  const presetDrugs = ALL_PRESETS;
  const customEntry = selected.find(d => !presetDrugs.includes(d)) || "";

  const toggle = (drug) => {
    if (selected.includes(drug)) {
      onChange(selected.filter(d => d !== drug));
    } else {
      onChange([...selected, drug]);
    }
  };

  const handleCustom = (value) => {
    const presets = selected.filter(d => presetDrugs.includes(d));
    onChange(value.trim() ? [...presets, value.trim()] : presets);
  };

  return (
    <div className="mt-2 space-y-2.5">
      {ANTICOAGULANT_GROUPS.map(group => (
        <div key={group.category}>
          <p className="text-[11px] font-semibold text-accent uppercase tracking-wide mb-1">{group.category}</p>
          <div className="flex flex-wrap gap-1.5">
            {group.drugs.map(drug => {
              const isSelected = selected.includes(drug);
              return (
                <button
                  key={drug}
                  onClick={() => toggle(drug)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                    isSelected
                      ? "bg-hive-gold/15 text-hive-gold border-hive-gold/40"
                      : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  {drug}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <input
        type="text"
        value={customEntry}
        onChange={(e) => handleCustom(e.target.value)}
        placeholder="Other (specify drug, dose, frequency)..."
        className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50"
      />
    </div>
  );
}