// Referral completeness, investigation status, and diagnosis severity helpers

export function isReferralIncomplete(c) {
  return !c.patient_dob ||
    !c.patient_mrn ||
    (!c.presenting_complaint && !c.referral_summary) ||
    !c.referrer_name;
}

export function isAwaitingAction(c) {
  // Awaiting doctor consultation or investigation results
  return c.status === "investigations" || c.status === "accepted";
}

export function getAwaitingReason(c) {
  if (c.status === "accepted") return "Awaiting doctor consultation";
  if (c.status === "investigations") return "Awaiting scan / bloods";
  return null;
}

export const SEVERITY_COLORS = {
  none: null,
  low: "#16A34A",
  moderate: "#D97706",
  high: "#EA580C",
  critical: "#DC2626",
};

export const SEVERITY_LABELS = {
  none: "Not Set",
  low: "Low",
  moderate: "Moderate",
  high: "High",
  critical: "Critical",
};

export function getInpatientGroup(c) {
  if (c.pre_op_status === "in_theatre") return "theatre";
  if (c.pre_op_status === "listed") return "listed";
  const ward = (c.ward || "").toLowerCase();
  if (ward.includes("icu") || ward.includes("hdu") || ward.includes("critical") || ward.includes("high dependency") || ward.includes("hd")) {
    return "icu";
  }
  return "ward";
}

export const INPATIENT_GROUP_CONFIG = {
  theatre: { label: "In Theatre", color: "#DC2626" },
  listed: { label: "Listed for Theatre", color: "#D97706" },
  icu: { label: "ICU / HDU", color: "#DC2626" },
  ward: { label: "Ward", color: "#3B82F6" },
};

export function groupInpatients(inpatients) {
  const groups = { theatre: [], listed: [], icu: [], ward: {} };
  inpatients.forEach((c) => {
    const group = getInpatientGroup(c);
    if (group === "ward") {
      const wardName = c.ward || "Unassigned Ward";
      if (!groups.ward[wardName]) groups.ward[wardName] = [];
      groups.ward[wardName].push(c);
    } else {
      groups[group].push(c);
    }
  });
  return groups;
}

export const DISCHARGE_PATHWAY_LABELS = {
  opd_followup: "OPD Follow-up",
  no_followup: "Home / GP",
  tci: "TCI — To Come In",
  not_discharged: "Not Discharged",
};