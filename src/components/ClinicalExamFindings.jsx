import React, { useState } from "react";
import { Stethoscope, Eye, Hand, Activity, Heart, AlertTriangle, Plus, X, Zap, Check } from "lucide-react";

// Quick "all normal" findings — one click to add the key negatives
const ORTHO_NORMAL_FINDINGS = [
  "Patient alert and oriented in time, place and person",
  "Patient comfortable at rest, no acute distress",
  "No neurovascular deficit distal to the injury",
  "Distal pulses palpable and symmetric",
  "Sensation intact distally in all dermatomes",
  "Motor function intact — normal power (MRC 5/5)",
  "Capillary refill less than 2 seconds",
  "No signs of compartment syndrome — compartment soft and compressible",
];

const GEN_SURG_NORMAL_FINDINGS = [
  "Patient alert and oriented in time, place and person",
  "Patient comfortable at rest, no acute distress",
  "Abdomen soft and non-tender on palpation",
  "Bowel sounds present and normal",
  "No palpable masses or organomegaly",
  "Hernial orifices intact — no palpable herniae",
  "All peripheral pulses palpable and symmetric",
  "Capillary refill less than 2 seconds",
];

const ORTHO_FINDINGS = {
  general: [
    "Patient alert and oriented in time, place and person",
    "Patient comfortable at rest, no acute distress",
    "Patient appears pale and diaphoretic",
    "Clinically unwell — septic appearance",
  ],
  neurovascular: [
    "No neurovascular deficit distal to the injury",
    "Distal pulses palpable and symmetric",
    "Sensation intact distally in all dermatomes",
    "Motor function intact — normal power (MRC 5/5)",
    "Capillary refill less than 2 seconds",
    "No signs of compartment syndrome — compartment soft and compressible",
    "Diminished sensation distal to injury",
    "Absent distal pulses — vascular compromise suspected",
  ],
  musculoskeletal: [
    "Visible deformity noted at the injury site",
    "Marked swelling and bruising present",
    "Tenderness localized on palpation",
    "Range of movement limited by pain",
    "Open fracture — skin integrity breached",
    "Wound clean and well-approximated",
    "Limb shortened and externally rotated",
    "No visible deformity or swelling",
  ],
  vascular: [
    "All peripheral pulses palpable and symmetric",
    "Dorsalis pedis pulse absent",
    "Posterior tibial pulse absent",
    "Limb warm and well-perfused",
    "Limb pale and cold distally",
  ],
  wound: [
    "Wound clean and well-approximated",
    "Wound erythema and induration present",
    "Purulent discharge from wound",
    "Serous discharge noted",
    "Wound dehiscence present",
    "No surrounding cellulitis",
    "Necrotic tissue at wound margins",
  ],
};

const GEN_SURG_FINDINGS = {
  general: [
    "Patient alert and oriented in time, place and person",
    "Patient comfortable at rest, no acute distress",
    "Patient appears pale and diaphoretic",
    "Clinically unwell — septic appearance",
    "Clinically jaundiced",
  ],
  abdominal: [
    "Abdomen soft and non-tender on palpation",
    "Tenderness elicited in the right iliac fossa",
    "Tenderness elicited in the right upper quadrant",
    "Tenderness elicited in the epigastrium",
    "Voluntary guarding present",
    "Rigid abdomen — involuntary guarding",
    "Rebound tenderness positive",
    "Murphy's sign positive",
    "Rovsing's sign positive",
    "Psoas sign positive",
    "Obturator sign positive",
    "Bowel sounds present and normal",
    "Bowel sounds absent",
    "No palpable masses or organomegaly",
    "Hernial orifices intact — no palpable herniae",
    "Abdomen distended",
    "Abdomen scaphoid — no distension",
  ],
  vascular: [
    "All peripheral pulses palpable and symmetric",
    "Capillary refill less than 2 seconds",
  ],
  wound: [
    "Wound clean and well-approximated",
    "Wound erythema and induration present",
    "Purulent discharge from wound",
    "Serous discharge noted",
    "No surrounding cellulitis",
  ],
};

const CATEGORY_CONFIG = {
  general: { label: "General", icon: Stethoscope },
  neurovascular: { label: "Neurovascular", icon: Activity },
  musculoskeletal: { label: "Musculoskeletal", icon: Hand },
  abdominal: { label: "Abdominal", icon: Stethoscope },
  vascular: { label: "Vascular", icon: Heart },
  wound: { label: "Wound / Skin", icon: AlertTriangle },
};

export default function ClinicalExamFindings({ selected, onToggle, department }) {
  const [openCategory, setOpenCategory] = useState("general");
  const findings = department === "general_surgery" ? GEN_SURG_FINDINGS : ORTHO_FINDINGS;

  const normalFindings = department === "general_surgery" ? GEN_SURG_NORMAL_FINDINGS : ORTHO_NORMAL_FINDINGS;

  const toggle = (finding) => {
    if (selected.includes(finding)) {
      onToggle(selected.filter(f => f !== finding));
    } else {
      onToggle([...selected, finding]);
    }
  };

  const quickNormal = () => {
    const merged = [...selected];
    for (const f of normalFindings) {
      if (!merged.includes(f)) merged.push(f);
    }
    onToggle(merged);
  };

  const allNormalsSelected = normalFindings.every(f => selected.includes(f));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-gray-500" />
          <p className="text-xs text-gray-500">Tap findings to add them in clinical language to the admission note.</p>
        </div>
        <button onClick={quickNormal}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
            allNormalsSelected
              ? "bg-green-500/15 text-green-600 border-green-500/20"
              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
          }`}>
          <Zap className="w-3 h-3" /> Quick Normal
        </button>
      </div>

      {/* Selected findings chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(f => (
            <button key={f} onClick={() => toggle(f)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-900 text-white text-[11px] font-medium">
              {f}
              <X className="w-2.5 h-2.5" />
            </button>
          ))}
        </div>
      )}

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(findings).map(([key, items]) => {
          const config = CATEGORY_CONFIG[key];
          const Icon = config?.icon || Plus;
          const count = items.filter(f => selected.includes(f)).length;
          return (
            <button key={key} onClick={() => setOpenCategory(key)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                openCategory === key
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
              }`}>
              <Icon className="w-3 h-3" />
              {config?.label || key}
              {count > 0 && <span className="ml-0.5 text-[10px] opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Findings for active category */}
      {openCategory && findings[openCategory] && (
        <div className="flex flex-wrap gap-1.5">
          {findings[openCategory].map(finding => {
            const isSelected = selected.includes(finding);
            return (
              <button key={finding} onClick={() => toggle(finding)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  isSelected
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                }`}>
                {isSelected ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {finding}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}