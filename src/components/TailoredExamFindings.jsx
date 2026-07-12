import React, { useState } from "react";
import { Stethoscope, Heart, Hand, Activity, AlertTriangle, Plus, X, Zap, ChevronDown, Info } from "lucide-react";
import { getExamProfile } from "@/lib/examProfiles";
import { ExamGuideSection, DermatomeMap, MyotomeGuide, ReflexGuide, AbdominalExamGuide, VascularExamGuide, WoundAssessmentGuide } from "@/components/ExamGuides";

const CATEGORY_CONFIG = {
  general: { label: "General", icon: Stethoscope },
  neurovascular: { label: "Neurovascular", icon: Activity },
  musculoskeletal: { label: "Musculoskeletal", icon: Hand },
  abdominal: { label: "Abdominal", icon: Stethoscope },
  vascular: { label: "Vascular", icon: Heart },
  wound: { label: "Wound / Skin", icon: AlertTriangle },
};

const GUIDE_RENDERERS = {
  dermatome: { title: "Dermatome Map — Sensory Testing", icon: Activity, render: () => <DermatomeMap /> },
  myotome: { title: "Myotome Guide — Motor Testing", icon: Hand, render: () => <MyotomeGuide /> },
  reflex: { title: "Deep Tendon Reflexes", icon: Activity, render: () => <ReflexGuide /> },
  abdominal: { title: "Abdominal Examination", icon: Stethoscope, render: () => <AbdominalExamGuide /> },
  vascular: { title: "Vascular Examination — DP/PT & Perfusion", icon: Heart, render: () => <VascularExamGuide /> },
  neurovascular: { title: "Neurovascular Status", icon: Activity, render: () => <NeurovascularGuide /> },
};

function NeurovascularGuide() {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-2">Document the 6 P's of acute limb ischaemia and distal neurovascular status.</p>
      {[
        { point: 'Pain', detail: 'Assess for ischaemic pain (severe, worse on passive stretch)' },
        { point: 'Pallor', detail: 'Compare affected vs unaffected limb colour' },
        { point: 'Pulseless', detail: 'Palpate distal pulses (DP, PT, radial, ulnar) — compare bilaterally' },
        { point: 'Paraesthesia', detail: 'Test sensation in all dermatomes distal to the injury' },
        { point: 'Paralysis', detail: 'Test motor power (MRC 0–5) in all relevant myotomes' },
        { point: 'Perishing cold', detail: 'Assess temperature of affected limb vs contralateral' },
        { point: 'Capillary Refill', detail: 'Press nail bed or blanch skin; normal <2 seconds' },
      ].map((p) => (
        <div key={p.point} className="p-2.5 rounded-lg bg-secondary/30 border border-border">
          <span className="text-sm font-medium text-hive-gold">{p.point}</span>
          <p className="text-xs text-muted-foreground mt-0.5">{p.detail}</p>
        </div>
      ))}
    </div>
  );
}

export default function TailoredExamFindings({ caseData, selected, onToggle }) {
  const profile = getExamProfile(caseData);
  const findings = profile.findings;
  const [openCategory, setOpenCategory] = useState(
    Object.keys(findings).find(k => findings[k].length > 0) || "general"
  );

  const toggle = (finding) => {
    if (selected.includes(finding)) {
      onToggle(selected.filter(f => f !== finding));
    } else {
      onToggle([...selected, finding]);
    }
  };

  const quickNormal = () => {
    const merged = [...selected];
    const normalFindings = (findings.neurovascular || []).concat(findings.vascular || []);
    for (const f of normalFindings) {
      if (f.toLowerCase().includes("no ") || f.toLowerCase().includes("intact") || f.toLowerCase().includes("palpable") || f.toLowerCase().includes("less than") || f.toLowerCase().includes("soft") || f.toLowerCase().includes("well-perfused") || f.toLowerCase().includes("warm")) {
        if (!merged.includes(f)) merged.push(f);
      }
    }
    // Also add general normal findings
    for (const f of (findings.general || [])) {
      if ((f.toLowerCase().includes("alert") || f.toLowerCase().includes("comfortable")) && !merged.includes(f)) {
        merged.push(f);
      }
    }
    onToggle(merged);
  };

  return (
    <div className="space-y-3">
      {/* Profile banner */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
        <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-blue-900">{profile.label}</p>
          <p className="text-[11px] text-blue-700">{profile.clinicalNote}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-500">Tap findings to add them in clinical language to the admission note.</p>
        <button onClick={quickNormal}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400 transition-colors">
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

      {/* Complaint-tailored exam guides */}
      {profile.guides.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Guides for this presentation</p>
          {profile.guides.map((guideKey, idx) => {
            const guide = GUIDE_RENDERERS[guideKey];
            if (!guide) return null;
            return (
              <ExamGuideSection key={guideKey} title={guide.title} icon={guide.icon}>
                {guide.render()}
              </ExamGuideSection>
            );
          })}
        </div>
      )}
    </div>
  );
}