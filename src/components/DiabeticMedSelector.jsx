import React from "react";
import { Check } from "lucide-react";

const DIABETIC_MED_GROUPS = [
  {
    category: "Insulin",
    drugs: [
      "Insulin Glargine (Lantus)",
      "Insulin Detemir (Levemir)",
      "Insulin Degludec (Tresiba)",
      "Insulin Lispro (Humalog)",
      "Insulin Aspart (Novorapid)",
      "Insulin Glulisine (Apidra)",
      "Novomix 30",
      "Humulin M3",
      "Human Insulin (Actrapid)",
      "Insulin Isophane (Insulatard)",
    ],
  },
  {
    category: "Oral Hypoglycemics",
    drugs: [
      "Metformin 500mg BD",
      "Metformin 1g BD",
      "Metformin (MR) 1g OD",
      "Gliclazide 80mg OD",
      "Gliclazide 40mg BD",
      "Gliclazide MR 60mg OD",
      "Glipizide 5mg OD",
      "Sitagliptin 100mg OD",
      "Linagliptin 5mg OD",
      "Alogliptin 25mg OD",
      "Pioglitazone 30mg OD",
      "Empagliflozin 10mg OD",
      "Dapagliflozin 10mg OD",
      "Semaglutide (Ozempic) weekly",
      "Liraglutide (Victoza) daily",
      "Dulaglutide (Trulicity) weekly",
      "Acarbose 50mg TDS",
      "Repaglinide 1mg TDS",
    ],
  },
];

const ALL_PRESETS = DIABETIC_MED_GROUPS.flatMap(g => g.drugs);

export function getDiabeticMedCategory(drug) {
  for (const group of DIABETIC_MED_GROUPS) {
    if (group.drugs.includes(drug)) return group.category;
  }
  return "Other";
}

export function formatDiabeticMeds(meds) {
  if (!meds || meds.length === 0) return null;
  const grouped = {};
  for (const drug of meds) {
    const cat = getDiabeticMedCategory(drug);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(drug);
  }
  const parts = Object.entries(grouped).map(([cat, drugs]) =>
    `${cat} — ${drugs.join(", ")}`
  );
  return `Diabetic medications: ${parts.join("; ")}`;
}

export default function DiabeticMedSelector({ selected = [], onChange }) {
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
      {DIABETIC_MED_GROUPS.map(group => (
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