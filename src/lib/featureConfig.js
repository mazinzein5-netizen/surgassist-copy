/**
 * HIVE Feature Configuration
 *
 * Controls which features are visible based on deployment mode.
 *
 * LITE_MODE (default — public App Store / Play Store version):
 *   - Client-side storage only (individual doctors)
 *   - Administrative / intake branding only
 *   - Clinical intelligence features hidden ("asleep")
 *   - No automated triage, diagnosis, or decision support in UI
 *
 * ENTERPRISE_MODE (hospital / group clients — separate build):
 *   - Secure cloud-synced backend
 *   - Full clinical intelligence (Jack, triage, safety checks)
 *   - Requires enterprise license key
 *
 * Toggle by setting ENTERPRISE_MODE to true for hospital deployments.
 */

export const ENTERPRISE_MODE = false;

export const FEATURES = {
  // Clinical intelligence (enterprise only)
  jackSafetyPanel: ENTERPRISE_MODE,
  triageChat: ENTERPRISE_MODE,
  periopAlerts: ENTERPRISE_MODE,
  woundAIEvaluation: ENTERPRISE_MODE,
  drugCalculator: ENTERPRISE_MODE,
  vteProphylaxis: ENTERPRISE_MODE,
  theatreChecklist: ENTERPRISE_MODE,
  operativeNote: ENTERPRISE_MODE,

  // Administrative / intake (always available)
  caseList: true,
  patientInfoEditor: true,
  clerkingProforma: true,
  investigations: true,
  admissionNote: true,
  inpatientNote: true,
  dischargeDocs: true,
  exportShare: true,
};

export function isFeatureEnabled(featureName) {
  return !!FEATURES[featureName];
}