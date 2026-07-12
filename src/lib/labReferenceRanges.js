// Standard adult reference ranges (Irish clinical laboratory standards)
// Returns { min, max, unit, label } or null if unknown

export const LAB_RANGES = {
  haemoglobin: { min: 130, max: 170, unit: "g/L", label: "Hb" },
  wcc: { min: 4.0, max: 11.0, unit: "×10⁹/L", label: "WCC" },
  platelets: { min: 150, max: 400, unit: "×10⁹/L", label: "Plts" },
  sodium: { min: 135, max: 145, unit: "mmol/L", label: "Na" },
  potassium: { min: 3.5, max: 5.1, unit: "mmol/L", label: "K" },
  urea: { min: 2.5, max: 7.8, unit: "mmol/L", label: "Urea" },
  creatinine: { min: 60, max: 110, unit: "µmol/L", label: "Cr" },
  crp: { min: 0, max: 5, unit: "mg/L", label: "CRP" },
  egfr: { min: 90, max: 999, unit: "mL/min", label: "eGFR" },
  bilirubin: { min: 3, max: 21, unit: "µmol/L", label: "Bilirubin" },
  alt: { min: 7, max: 40, unit: "U/L", label: "ALT" },
  albumin: { min: 35, max: 50, unit: "g/L", label: "Alb" },
  inr: { min: 0.8, max: 1.2, unit: "", label: "INR" },
};

export function getRange(testType) {
  return LAB_RANGES[testType] || null;
}

export function isOutOfRange(testType, value) {
  const range = getRange(testType);
  if (!range || value == null || isNaN(value)) return false;
  return value < range.min || value > range.max;
}

export function formatRange(testType) {
  const range = getRange(testType);
  if (!range) return "";
  return `${range.min}–${range.max} ${range.unit}`.trim();
}