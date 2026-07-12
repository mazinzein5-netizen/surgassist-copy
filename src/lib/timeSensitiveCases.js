/**
 * Detects time-sensitive surgical conditions from case data.
 * Returns array of matched flags with label, severity, and urgency reason.
 */
export function detectTimeSensitiveConditions(caseData) {
  const text = [
    caseData.presenting_complaint,
    caseData.referral_summary,
    caseData.diagnosis,
    caseData.mechanism_of_injury,
    caseData.presenting_complaint,
  ].filter(Boolean).join(" ").toLowerCase();

  const flags = [];

  // Hip fracture
  if (/\b(hip\s+fract|femoral\s+neck|intertrochanteric|subtrochanteric|neck\s+of\s+femur|nof|#nof)\b/.test(text)) {
    flags.push({
      key: "hip_fracture",
      label: "Hip Fracture",
      severity: "critical",
      reason: "Requires admission, early surgery (within 36h per IHFD), VTE prophylaxis, and analgesia protocol.",
    });
  }

  // Spine fracture / Cauda Equina Syndrome
  if (/\b(cauda\s+equina|ces)\b/.test(text)) {
    flags.push({
      key: "ces",
      label: "Cauda Equina Syndrome",
      severity: "critical",
      reason: "Surgical emergency — MRI now, decompression within 24-48h. Check for saddle anaesthesia, urinary retention, bilateral sciatica.",
    });
  }
  if (/\b(spine\s+fract|spinal\s+fract|vertebral\s+fract|burst\s+fract|compression\s+fract|cord\s+compress)\b/.test(text)) {
    flags.push({
      key: "spine_fracture",
      label: "Spinal Fracture",
      severity: "critical",
      reason: "Neurological assessment urgent. Consider SCI protocol, MRI/CT. Immobilise if unstable.",
    });
  }

  // Perforated viscus / peritonitis
  if (/\b(perforat|peritonitis|pneumoperitoneum|free\s+air|free\s+gas|ruptured\s+viscus|perforated\s+viscus)\b/.test(text)) {
    flags.push({
      key: "perforated_viscus",
      label: "Perforated Viscus",
      severity: "critical",
      reason: "Surgical emergency — resuscitate, broad-spectrum antibiotics, urgent theatre. Erect CXR for free air.",
    });
  }

  // Sepsis
  if (/\b(sepsis|septic|pyrex|systemic\s+inflammatory|neutropenic|febrile\s+neutropenia)\b/.test(text)) {
    flags.push({
      key: "sepsis",
      label: "Sepsis",
      severity: "critical",
      reason: "Sepsis 6 within 1 hour — cultures, broad-spectrum antibiotics, IV fluids, lactate. INEWS monitoring.",
    });
  }

  // Pediatric case
  let isPediatric = false;
  if (caseData.patient_dob) {
    const age = (new Date() - new Date(caseData.patient_dob)) / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 16) isPediatric = true;
  }
  if (/\b(paediatr|pediatr|child|infant|toddler|newborn|neonate)\b/.test(text)) isPediatric = true;
  if (isPediatric) {
    flags.push({
      key: "pediatric",
      label: "Pediatric Case",
      severity: "high",
      reason: "Pediatric protocol — weight-based dosing, safeguarding check, senior review required.",
    });
  }

  // Geriatric case (age >= 65)
  let isGeriatric = false;
  if (caseData.patient_dob) {
    const age = (new Date() - new Date(caseData.patient_dob)) / (1000 * 60 * 60 * 24 * 365.25);
    if (age >= 65) isGeriatric = true;
  }
  if (isGeriatric) {
    flags.push({
      key: "geriatric",
      label: "Geriatric Patient",
      severity: "high",
      reason: "Comprehensive Geriatric Assessment, delirium screen, falls risk, polypharmacy review, early mobilisation.",
    });
  }

  // Compartment syndrome
  if (/\b(compartment\s+syndrome|isch(ae|e)mia|limb\s+threat|vascular\s+comprom)\b/.test(text)) {
    flags.push({
      key: "compartment",
      label: "Compartment Syndrome Risk",
      severity: "critical",
      reason: "Time-critical — assess compartments, consider fasciotomy. Monitor for the 5 P's (pain, pallor, pulselessness, paraesthesia, paralysis).",
    });
  }

  // Neurovascular deficit
  if (/\b(neurovascular\s+deficit|limb\s+ischaem|absent\s+pulse|vascular\s+injury)\b/.test(text)) {
    flags.push({
      key: "neurovascular",
      label: "Neurovascular Deficit",
      severity: "critical",
      reason: "Vascular surgery review urgent. Document pulses, Doppler if needed. Time to revascularisation is critical.",
    });
  }

  // Open fracture
  if (/\b(open\s+fract|compound\s+fract)\b/.test(text)) {
    flags.push({
      key: "open_fracture",
      label: "Open Fracture",
      severity: "high",
      reason: "BOAST 4 — IV antibiotics within 1 hour, photographic documentation, plastic surgery referral, urgent washout/debridement.",
    });
  }

  return flags;
}

export function isTimeSensitive(caseData) {
  return detectTimeSensitiveConditions(caseData).length > 0;
}

export function hasCriticalFlag(caseData) {
  return detectTimeSensitiveConditions(caseData).some(f => f.severity === "critical");
}