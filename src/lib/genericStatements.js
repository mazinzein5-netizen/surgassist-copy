// Detects body region from injury/complaint text for tailored generic statements

const REGION_KEYWORDS = {
  lower_proximal: ['hip', 'femur', 'femoral', 'neck of femur', 'nof', 'pelvis', 'acetabulum', 'intertrochanteric', 'trochanteric', 'subtrochanteric', 'shaft of femur'],
  lower_distal: ['knee', 'tibia', 'fibula', 'tibial', 'fibular', 'ankle', 'foot', 'calcaneus', 'achilles', 'malleolus', 'patella', 'tibial plateau', 'bimalleolar', 'trimalleolar'],
  upper_proximal: ['shoulder', 'humerus', 'humeral', 'clavicle', 'scapula', 'acromio', 'rotator cuff', 'glenohumeral', 'proximal humerus'],
  upper_distal: ['wrist', 'hand', 'finger', 'radius', 'radial', 'ulna', 'ulnar', 'scaphoid', 'metacarpal', 'phalanx', 'distal radius', 'colles', 'smith'],
  spine: ['spine', 'spinal', 'cervical', 'lumbar', 'thoracic', 'disc', 'vertebra', 'cord'],
  abdominal: ['abdomen', 'abdominal', 'appendix', 'appendicitis', 'appendic', 'gallbladder', 'cholecystitis', 'cholecyst', 'biliary', 'bowel', 'intestine', 'hernia', 'obstruction', 'perforation', 'diverticulitis', 'pancreatitis', 'mesenteric', 'abd pain', 'ruq', 'rlq', 'luq', 'llq'],
  perianal: ['perianal', 'perianal abscess', 'fistula', 'fissure', 'pilonidal', 'haemorrhoid', 'hemorrhoid', 'abscess'],
};

export function detectBodyRegion(text = '') {
  const lower = text.toLowerCase();
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return region;
  }
  return 'default';
}

// Returns a tailored generic certified statement for a proforma item
// when no detail is provided. Returns null if no mapping exists.
export function getGenericStatement(question, answer, bodyRegion, department) {
  if (!question) return null;
  const q = question.toLowerCase().replace(/\?$/, '').trim();
  const r = bodyRegion || 'default';

  // ---- ORTHO NEUROVASCULAR ----
  if (q === 'sensation intact distally' && answer === 'yes') {
    const derm = {
      lower_proximal: 'L2-S2',
      lower_distal: 'L4-S3',
      upper_proximal: 'C4-T2',
      upper_distal: 'C6-C8',
      spine: 'below injury level',
      default: 'distal to injury',
    };
    return `No sensory alteration detected over ${derm[r] || derm.default} dermatomes`;
  }

  if (q === 'motor function intact' && answer === 'yes') {
    const myo = {
      lower_proximal: 'L2-S2',
      lower_distal: 'L4-S3',
      upper_proximal: 'C5-T1',
      upper_distal: 'C6-C8',
      spine: 'below injury level',
      default: 'distal to injury',
    };
    return `Power grade 5/5 in ${myo[r] || myo.default} myotome distribution`;
  }

  if (q === 'distal pulses palpable' && answer === 'yes') {
    const pulse = {
      lower_proximal: 'dorsalis pedis and posterior tibial',
      lower_distal: 'dorsalis pedis and posterior tibial',
      upper_proximal: 'radial and ulnar',
      upper_distal: 'radial and ulnar',
      default: 'distal',
    };
    return `Distal pulses (${pulse[r] || pulse.default}) palpable and equal bilaterally`;
  }

  if (q === 'capillary refill < 2s' && answer === 'yes') {
    return 'Capillary refill less than 2 seconds distally';
  }

  // ---- ORTHO INJURY ASSESSMENT ----
  if (q === 'open fracture' && answer === 'no') {
    return 'No open fracture — skin integrity maintained (closed injury)';
  }
  if (q === 'open fracture' && answer === 'yes') {
    return 'Open fracture identified — Gustilo classification to be documented';
  }
  if (q === 'compartment syndrome signs' && answer === 'no') {
    return 'No features of compartment syndrome — compartments soft, no pain on passive stretch';
  }
  if (q === 'vascular compromise' && answer === 'no') {
    return 'No vascular compromise — distal perfusion intact';
  }
  if (q === 'neurological deficit' && answer === 'no') {
    return 'No neurological deficit detected';
  }
  if (q === 'skin integrity intact' && answer === 'yes') {
    return 'Skin integrity intact — no open wounds or breaks';
  }

  // ---- RED FLAGS ----
  if (q === 'head injury' && answer === 'no') {
    return 'No head injury';
  }
  if (q === 'polytrauma' && answer === 'no') {
    return 'Isolated injury — no polytrauma';
  }
  if (q === 'sepsis signs' && answer === 'no') {
    return 'No clinical signs of sepsis';
  }
  if (q === 'airway compromise' && answer === 'no') {
    return 'Airway maintained, no compromise';
  }

  // ---- KEY CLINICAL QUERIES (shared) ----
  if (answer === 'no') {
    const noMap = {
      'vomiting': 'No vomiting',
      'nausea': 'No nausea',
      'fever': 'Afebrile — no fever',
      'numbness/tingling': 'No numbness or tingling reported',
      'inability to bear weight': 'Able to bear weight',
      'visible deformity': 'No visible deformity',
      'jaundice': 'No jaundice',
      'bowel changes': 'No bowel changes',
      'abdominal distension': 'No abdominal distension',
    };
    if (noMap[q]) return noMap[q];
  }

  // ---- GEN SURG ABDOMINAL EXAM ----
  if (department === 'general_surgery') {
    if (q === 'abdomen soft and non-tender' && answer === 'yes') {
      return 'Abdomen soft and non-tender on palpation';
    }
    if (q === 'guarding' && answer === 'no') {
      return 'No guarding';
    }
    if (q === 'rigidity' && answer === 'no') {
      return 'No rigidity';
    }
    if (q === 'rebound tenderness' && answer === 'no') {
      return 'No rebound tenderness (negative Blumberg sign)';
    }
    if (q === 'bowel sounds present' && answer === 'yes') {
      return 'Bowel sounds present and normal';
    }
    if (q === 'palpable mass' && answer === 'no') {
      return 'No palpable abdominal mass';
    }
    if (q === 'murphy sign' && answer === 'no') {
      return 'Murphy sign negative';
    }
    if (q === 'rovsing sign' && answer === 'no') {
      return 'Rovsing sign negative';
    }
    if (q === 'psoas sign' && answer === 'no') {
      return 'Psoas sign negative';
    }
    if (q === 'hernia orifices intact' && answer === 'yes') {
      return 'Hernia orifices intact — no palpable hernia';
    }
    if (q === 'peritonitis signs' && answer === 'no') {
      return 'No signs of peritonitis';
    }
    if (q === 'bowel obstruction signs' && answer === 'no') {
      return 'No signs of bowel obstruction';
    }
  }

  // ---- PMH & SOCIAL (shared) ----
  if (q === 'on anticoagulants' && answer === 'no') {
    return 'Not on anticoagulants';
  }
  if (q === 'diabetic' && answer === 'no') {
    return 'Non-diabetic';
  }
  if (q === 'smoker' && answer === 'no') {
    return 'Non-smoker';
  }
  if (q === 'osteoporosis' && answer === 'no') {
    return 'No known osteoporosis';
  }
  if (q === 'known allergies' && answer === 'no') {
    return 'No known allergies (NKDA)';
  }
  if (q === 'previous abdominal surgery' && answer === 'no') {
    return 'No previous abdominal surgery';
  }

  // Fallback — no generic statement available
  return null;
}