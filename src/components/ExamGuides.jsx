import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export function ExamGuideSection({ title, icon: Icon, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-hive-gold" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 py-4 border-t border-border animate-fade-in">{children}</div>}
    </div>
  );
}

export function DermatomeMap() {
  const [view, setView] = useState('front');
  const dermatomes = [
    { root: 'C4', area: 'Top of shoulders', color: '#EF4444' },
    { root: 'C5', area: 'Outer upper arm', color: '#F97316' },
    { root: 'C6', area: 'Outer forearm, thumb', color: '#F59E0B' },
    { root: 'C7', area: 'Middle finger', color: '#EAB308' },
    { root: 'C8', area: 'Little finger, inner forearm', color: '#84CC16' },
    { root: 'T1', area: 'Inner upper arm', color: '#22C55E' },
    { root: 'T4', area: 'Nipple line', color: '#14B8A6' },
    { root: 'T6', area: 'Xiphoid process', color: '#06B6D4' },
    { root: 'T10', area: 'Umbilicus', color: '#3B82F6' },
    { root: 'T12', area: 'Inguinal region', color: '#6366F1' },
    { root: 'L1', area: 'Upper thigh', color: '#8B5CF6' },
    { root: 'L2', area: 'Anterior mid-thigh', color: '#A855F7' },
    { root: 'L3', area: 'Medial knee', color: '#D946EF' },
    { root: 'L4', area: 'Medial calf, medial malleolus', color: '#EC4899' },
    { root: 'L5', area: 'Lateral calf, dorsum of foot, great toe', color: '#F43F5E' },
    { root: 'S1', area: 'Lateral foot, posterior calf', color: '#DC2626' },
    { root: 'S2', area: 'Posterior thigh', color: '#B91C1C' },
  ];

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">Test pin prick and light touch in each area. Compare left vs right.</p>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setView('front')} className={`px-3 py-1 rounded text-xs font-medium ${view === 'front' ? 'bg-hive-gold/20 text-hive-gold' : 'bg-secondary text-muted-foreground'}`}>Anterior</button>
        <button onClick={() => setView('back')} className={`px-3 py-1 rounded text-xs font-medium ${view === 'back' ? 'bg-hive-gold/20 text-hive-gold' : 'bg-secondary text-muted-foreground'}`}>Posterior</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {dermatomes.map((d) => (
          <div key={d.root} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <div>
              <span className="text-sm font-bold text-foreground">{d.root}</span>
              <span className="text-xs text-muted-foreground ml-2">{d.area}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3 italic">Reference: RCSI anatomy curriculum. Always correlate with clinical presentation.</p>
    </div>
  );
}

export function MyotomeGuide() {
  const myotomes = [
    { movement: 'Shoulder Abduction', muscle: 'Deltoid', roots: 'C5', predominant: 'C5' },
    { movement: 'Elbow Flexion', muscle: 'Biceps', roots: 'C5, C6', predominant: 'C5' },
    { movement: 'Elbow Extension', muscle: 'Triceps', roots: 'C7', predominant: 'C7' },
    { movement: 'Wrist Extension', muscle: 'Extensor carpi radialis', roots: 'C6', predominant: 'C6' },
    { movement: 'Wrist Flexion', muscle: 'Flexor carpi radialis', roots: 'C7', predominant: 'C7' },
    { movement: 'Finger Flexion', muscle: 'Flexor digitorum', roots: 'C8', predominant: 'C8' },
    { movement: 'Finger Abduction', muscle: 'Dorsal interossei', roots: 'T1', predominant: 'T1' },
    { movement: 'Hip Flexion', muscle: 'Iliopsoas', roots: 'L1, L2', predominant: 'L2' },
    { movement: 'Hip Adduction', muscle: 'Adductors', roots: 'L2, L3', predominant: 'L3' },
    { movement: 'Hip Abduction', muscle: 'Gluteus medius', roots: 'L5', predominant: 'L5' },
    { movement: 'Knee Extension', muscle: 'Quadriceps', roots: 'L3, L4', predominant: 'L4' },
    { movement: 'Knee Flexion', muscle: 'Hamstrings', roots: 'L5, S1', predominant: 'S1' },
    { movement: 'Ankle Dorsiflexion', muscle: 'Tibialis anterior', roots: 'L4, L5', predominant: 'L4' },
    { movement: 'Great Toe Extension', muscle: 'EHL', roots: 'L5', predominant: 'L5' },
    { movement: 'Ankle Plantarflexion', muscle: 'Gastrocnemius', roots: 'S1, S2', predominant: 'S1' },
  ];

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">Test each movement against resistance. Grade power 0-5 (MRC scale). Compare bilaterally.</p>
      <div className="space-y-2">
        {myotomes.map((m) => (
          <div key={m.movement} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border">
            <div className="flex-1">
              <span className="text-sm font-medium text-foreground">{m.movement}</span>
              <span className="text-xs text-muted-foreground ml-2">({m.muscle})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{m.roots}</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-hive-gold/15 text-hive-gold">Predominantly {m.predominant}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3 italic">MRC Power Scale: 0=No contraction, 1=Flicker, 2=Active movement (gravity eliminated), 3=Against gravity, 4=Against gravity+resistance, 5=Normal</p>
    </div>
  );
}

export function ReflexGuide() {
  const reflexes = [
    { reflex: 'Biceps', roots: 'C5, C6', method: 'Place thumb on biceps tendon, strike thumb' },
    { reflex: 'Triceps', roots: 'C7', method: 'Strike triceps tendon above olecranon' },
    { reflex: 'Brachioradialis', roots: 'C5, C6', method: 'Strike radius ~5cm above wrist' },
    { reflex: 'Knee (Patellar)', roots: 'L3, L4', method: 'Strike patellar tendon below patella' },
    { reflex: 'Ankle (Achilles)', roots: 'S1', method: 'Strike Achilles tendon at posterior ankle' },
    { reflex: 'Plantar', roots: 'L5, S1', method: 'Stroke lateral sole from heel to base of great toe' },
  ];
  return (
    <div className="space-y-2">
      {reflexes.map((r) => (
        <div key={r.reflex} className="p-2.5 rounded-lg bg-secondary/30 border border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">{r.reflex} Reflex</span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-accent/15 text-accent">{r.roots}</span>
          </div>
          <p className="text-xs text-muted-foreground">{r.method}</p>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground mt-2 italic">Grade: 0=Absent, 1=Diminished, 2=Normal, 3=Exaggerated, 4=Clonus</p>
    </div>
  );
}

export function AbdominalExamGuide() {
  const regions = [
    { region: 'RUQ', organs: 'Liver, Gallbladder, Duodenum, Hepatic flexure' },
    { region: 'Epigastric', organs: 'Stomach, Pancreas, Aorta' },
    { region: 'LUQ', organs: 'Spleen, Splenic flexure, Stomach' },
    { region: 'Right Flank', organs: 'Right kidney, Ascending colon' },
    { region: 'Umbilical', organs: 'Small bowel, Transverse colon' },
    { region: 'Left Flank', organs: 'Left kidney, Descending colon' },
    { region: 'RLQ', organs: 'Appendix, Caecum, R ovary/tube' },
    { region: 'Suprapubic', organs: 'Bladder, Uterus' },
    { region: 'LLQ', organs: 'Sigmoid colon, L ovary/tube' },
  ];
  const signs = [
    { sign: 'Murphy\'s Sign', indication: 'Cholecystitis — palpate RUQ during inspiration; positive if pain + inspiratory arrest' },
    { sign: 'Rovsing\'s Sign', indication: 'Appendicitis — RLQ pain on LLQ palpation' },
    { sign: 'Psoas Sign', indication: 'Appendicitis — pain on resisted hip flexion or extension' },
    { sign: 'Obturator Sign', indication: 'Appendicitis — pain on internal rotation of flexed hip' },
    { sign: 'Rebound Tenderness', indication: 'Peritonism — pain on release of pressure' },
    { sign: 'Blumberg\'s Sign', indication: 'Peritonitis — rebound tenderness on release' },
  ];
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Abdominal Regions</p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {regions.map((r) => (
          <div key={r.region} className="p-2 rounded bg-secondary/30 border border-border text-center">
            <div className="text-xs font-bold text-hive-gold">{r.region}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{r.organs}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Special Signs</p>
      <div className="space-y-2">
        {signs.map((s) => (
          <div key={s.sign} className="p-2.5 rounded-lg bg-secondary/30 border border-border">
            <span className="text-sm font-medium text-foreground">{s.sign}</span>
            <p className="text-xs text-muted-foreground mt-0.5">{s.indication}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VascularExamGuide() {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">Assess the 6 P's: Pain, Pallor, Pulseless, Paraesthesia, Paralysis, Perishing cold</p>
      <div className="space-y-2">
        {[
          { point: 'Femoral Pulse', location: 'Mid-inguinal point, below inguinal ligament' },
          { point: 'Popliteal Pulse', location: 'Deep in popliteal fossa, knee slightly flexed' },
          { point: 'Posterior Tibial', location: 'Behind medial malleolus' },
          { point: 'Dorsalis Pedis', location: 'Lateral to EHL tendon on dorsum of foot' },
          { point: 'Capillary Refill', location: 'Press nail bed/blanch skin; normal <2 seconds' },
          { point: 'Buerger\'s Test', location: 'Elevate leg to 45°; positive if pallor. Then dependant — reactive hyperaemia indicates ischaemia' },
        ].map((p) => (
          <div key={p.point} className="p-2.5 rounded-lg bg-secondary/30 border border-border">
            <span className="text-sm font-medium text-hive-gold">{p.point}</span>
            <p className="text-xs text-muted-foreground mt-0.5">{p.location}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WoundAssessmentGuide() {
  return (
    <div className="space-y-2">
      {[
        { item: 'Site', detail: 'Anatomical location, laterality' },
        { item: 'Size', detail: 'Length × width × depth in cm' },
        { item: 'Margins', detail: 'Well-defined vs undermined, regular vs irregular' },
        { item: 'Depth', detail: 'Structures involved (skin, fat, fascia, muscle, bone). Check for joint involvement.' },
        { item: 'Discharge', detail: 'Serous, serosanguinous, purulent, haemorrhagic. Note odour.' },
        { item: 'Tracking', detail: 'Probe for sinus tracts or cavities. Assess for foreign body.' },
        { item: 'Surrounding Skin', detail: 'Erythema (measure extent), induration, warmth, crepitus, blistering, necrosis' },
        { item: 'Gustilo Classification', detail: 'I: <1cm, clean. II: 1-10cm, no extensive damage. IIIA: >10cm, adequate soft tissue cover. IIIB: Requires flap coverage. IIIC: Vascular injury requiring repair' },
      ].map((w) => (
        <div key={w.item} className="p-2.5 rounded-lg bg-secondary/30 border border-border">
          <span className="text-sm font-medium text-hive-gold">{w.item}</span>
          <p className="text-xs text-muted-foreground mt-0.5">{w.detail}</p>
        </div>
      ))}
    </div>
  );
}