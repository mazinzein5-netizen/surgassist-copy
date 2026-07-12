/**
 * Complaint-tailored examination profiles.
 * Each profile has:
 *  - match: function(presentingComplaint, referralSummary, caseData) => boolean
 *  - label: display name
 *  - findings: { category: [finding, ...] } — complaint-specific tappable findings
 *  - guides: array of guide keys to show ("dermatome","myotome","reflex","abdominal","vascular","wound")
 *  - defaultOpen: guide key to auto-expand
 *  - clinicalNote: short rationale shown to the clinician
 */

export const EXAM_PROFILES = [
  {
    key: "hip_fracture",
    label: "Hip / Neck of Femur Fracture",
    match: (pc, rs, cd) => {
      const text = `${pc || ""} ${rs || ""} ${cd?.mechanism_of_injury || ""} ${cd?.diagnosis || ""}`.toLowerCase();
      return text.includes("hip") || text.includes("nof") || text.includes("neck of femur")
        || text.includes("femoral neck") || text.includes("intertrochanteric")
        || (text.includes("fall") && text.includes("externally rotated"));
    },
    findings: {
      general: [
        "Patient alert and oriented in time, place and person",
        "Patient comfortable at rest, no acute distress",
        "Patient appears pale and diaphoretic",
      ],
      neurovascular: [
        "No neurovascular deficit distal to the injury",
        "Sensation intact in all dermatomes of the affected limb",
        "Motor function intact — normal power (MRC 5/5) in all myotomes",
        "No signs of compartment syndrome — compartment soft and compressible",
      ],
      musculoskeletal: [
        "Affected leg shortened and externally rotated",
        "Tenderness localized over the greater trochanter",
        "Tenderness elicited on axial compression of the heel",
        "Range of movement limited by pain — hip flexion and external rotation painful",
        "No visible deformity or swelling",
        "Unable to weight bear on affected side",
        "Able to straight leg raise — excludes extensor mechanism disruption",
      ],
      vascular: [
        "Dorsalis pedis pulse palpable and symmetric bilaterally",
        "Posterior tibial pulse palpable and symmetric bilaterally",
        "Capillary refill less than 2 seconds in the affected foot",
        "Affected limb warm and well-perfused",
        "Dorsalis pedis pulse absent on the affected side",
        "Posterior tibial pulse absent on the affected side",
        "Limb pale and cold distally — vascular compromise suspected",
        "Capillary refill greater than 3 seconds — impaired perfusion",
      ],
    },
    guides: ["vascular", "neurovascular"],
    defaultOpen: "vascular",
    clinicalNote: "NOF fracture — document DP/PT pulses, capillary refill, and plantar perfusion on the affected side.",
  },
  {
    key: "ankle_fracture",
    label: "Ankle / Lower Limb Fracture",
    match: (pc, rs, cd) => {
      const text = `${pc || ""} ${rs || ""} ${cd?.mechanism_of_injury || ""} ${cd?.diagnosis || ""}`.toLowerCase();
      return text.includes("ankle") || text.includes("malleol") || text.includes("bimalleolar")
        || text.includes("trimalleolar") || text.includes("weber") || text.includes("pott")
        || text.includes("foot fracture") || text.includes("calcaneus") || text.includes("metatarsal");
    },
    findings: {
      general: [
        "Patient alert and oriented in time, place and person",
        "Patient comfortable at rest, no acute distress",
      ],
      neurovascular: [
        "No neurovascular deficit distal to the injury",
        "Sensation intact in all dermatomes of the affected limb",
        "Motor function intact — normal power (MRC 5/5)",
        "No signs of compartment syndrome — compartment soft and compressible",
      ],
      musculoskeletal: [
        "Visible swelling and bruising around the ankle",
        "Tenderness localized over the lateral malleolus",
        "Tenderness localized over the medial malleolus",
        "Range of movement limited by pain — inversion/eversion painful",
        "Unable to weight bear on affected side",
        "No visible deformity or swelling",
      ],
      vascular: [
        "Dorsalis pedis pulse palpable and symmetric bilaterally",
        "Posterior tibial pulse palpable and symmetric bilaterally",
        "Capillary refill less than 2 seconds in the affected toes",
        "Affected foot warm and well-perfused",
        "Dorsalis pedis pulse absent on the affected side",
        "Posterior tibial pulse absent on the affected side",
        "Foot pale and cold distally — vascular compromise suspected",
      ],
    },
    guides: ["vascular", "neurovascular"],
    defaultOpen: "vascular",
    clinicalNote: "Ankle/lower limb fracture — document DP/PT pulses and capillary refill to exclude vascular injury.",
  },
  {
    key: "wrist_fracture",
    label: "Wrist / Distal Radius Fracture",
    match: (pc, rs, cd) => {
      const text = `${pc || ""} ${rs || ""} ${cd?.mechanism_of_injury || ""} ${cd?.diagnosis || ""}`.toLowerCase();
      return text.includes("wrist") || text.includes("distal radius") || text.includes("colles")
        || text.includes("smith") || text.includes("scaphoid") || text.includes("hand fracture")
        || text.includes("metacarpal") || text.includes("phalanx");
    },
    findings: {
      general: [
        "Patient alert and oriented in time, place and person",
        "Patient comfortable at rest, no acute distress",
      ],
      neurovascular: [
        "No neurovascular deficit distal to the injury",
        "Sensation intact — median, ulnar and radial nerve territories",
        "Motor function intact — normal power (MRC 5/5) in all myotomes",
        "No signs of compartment syndrome — compartment soft and compressible",
      ],
      musculoskeletal: [
        "Dinner fork deformity of the wrist",
        "Visible swelling and bruising around the wrist",
        "Tenderness localized over the distal radius",
        "Tenderness in the anatomical snuffbox — scaphoid fracture suspected",
        "Range of movement limited by pain",
        "No visible deformity or swelling",
      ],
      vascular: [
        "Radial pulse palpable and symmetric bilaterally",
        "Ulnar pulse palpable and symmetric bilaterally",
        "Capillary refill less than 2 seconds in the affected fingers",
        "Affected hand warm and well-perfused",
        "Radial pulse absent on the affected side",
        "Hand pale and cold distally — vascular compromise suspected",
      ],
    },
    guides: ["neurovascular"],
    defaultOpen: "neurovascular",
    clinicalNote: "Wrist/hand fracture — document radial/ulnar pulses, capillary refill, and median/ulnar/radial nerve sensation.",
  },
  {
    key: "abdominal_pain",
    label: "Abdominal Pain / Peritonitis",
    match: (pc, rs, cd) => {
      const text = `${pc || ""} ${rs || ""} ${cd?.diagnosis || ""}`.toLowerCase();
      return text.includes("abdom") || text.includes("appendic") || text.includes("cholecyst")
        || text.includes("biliary") || text.includes("pancreat") || text.includes("bowel")
        || text.includes("obstruction") || text.includes("periton") || text.includes("ruq")
        || text.includes("rlq") || text.includes("epigastr") || text.includes("hernia")
        || text.includes("diverticul");
    },
    findings: {
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
    },
    guides: ["abdominal"],
    defaultOpen: "abdominal",
    clinicalNote: "Abdominal pathology — use targeted special signs (Murphy's, Rovsing's, psoas) based on the pain location.",
  },
  {
    key: "default_ortho",
    label: "Orthopaedic Examination",
    match: (pc, rs, cd) => cd?.department === "orthopaedics",
    findings: {
      general: [
        "Patient alert and oriented in time, place and person",
        "Patient comfortable at rest, no acute distress",
      ],
      neurovascular: [
        "No neurovascular deficit distal to the injury",
        "Distal pulses palpable and symmetric",
        "Sensation intact distally in all dermatomes",
        "Motor function intact — normal power (MRC 5/5)",
        "Capillary refill less than 2 seconds",
        "No signs of compartment syndrome — compartment soft and compressible",
      ],
      musculoskeletal: [
        "Visible deformity noted at the injury site",
        "Marked swelling and bruising present",
        "Tenderness localized on palpation",
        "Range of movement limited by pain",
        "Open fracture — skin integrity breached",
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
        "No surrounding cellulitis",
      ],
    },
    guides: ["vascular", "neurovascular"],
    defaultOpen: "vascular",
    clinicalNote: "Orthopaedic presentation — document neurovascular status and distal perfusion.",
  },
  {
    key: "default_gensurg",
    label: "General Surgery Examination",
    match: (pc, rs, cd) => cd?.department === "general_surgery" || true,
    findings: {
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
        "Voluntary guarding present",
        "Rigid abdomen — involuntary guarding",
        "Rebound tenderness positive",
        "Murphy's sign positive",
        "Bowel sounds present and normal",
        "No palpable masses or organomegaly",
        "Hernial orifices intact — no palpable herniae",
      ],
      vascular: [
        "All peripheral pulses palpable and symmetric",
        "Capillary refill less than 2 seconds",
      ],
      wound: [
        "Wound clean and well-approximated",
        "Wound erythema and induration present",
        "Purulent discharge from wound",
        "No surrounding cellulitis",
      ],
    },
    guides: ["abdominal"],
    defaultOpen: "abdominal",
    clinicalNote: "General surgical presentation — perform targeted abdominal exam with relevant special signs.",
  },
];

/**
 * Returns the best-matching exam profile for the case.
 */
export function getExamProfile(caseData) {
  const pc = caseData?.presenting_complaint || "";
  const rs = caseData?.referral_summary || "";
  for (const profile of EXAM_PROFILES) {
    if (profile.key === "default_ortho" || profile.key === "default_gensurg") continue;
    if (profile.match(pc, rs, caseData)) return profile;
  }
  // Fall back to department default
  if (caseData?.department === "orthopaedics") {
    return EXAM_PROFILES.find(p => p.key === "default_ortho");
  }
  return EXAM_PROFILES.find(p => p.key === "default_gensurg");
}