// Clinical workflow stage logic + status colors + timestamp formatting

export const STAGE_LABELS = ["Referral", "Active", "Review", "Discharged"];

export function getStage(caseData) {
  const s = caseData.status;
  if (s === "discharged" || s === "declined") return 3;
  if (s === "admitted" || s === "inews_consult" || s === "discharge_ready") return 2;
  if (s === "accepted" || s === "clerking" || s === "investigations") return 1;
  return 0;
}

export function getStatusColor(caseData) {
  const s = caseData.status;
  const triage = caseData.triage_decision;
  if (s === "discharged" || s === "declined") return "green";
  if (s === "inews_consult" || s === "accepted" || triage === "accept") return "red";
  if (s === "triage" || s === "referral_intake" || triage === "needs_more_info" || triage === "pending") return "amber";
  if (s === "clerking" || s === "investigations" || s === "admitted") return "amber";
  return "amber";
}

export const COLOR_HEX = {
  red: "#DC2626",
  amber: "#D97706",
  green: "#16A34A",
  neutral: "#6B7280",
};

export function formatTimestamp(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  const day = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day} · ${time}`;
}

export function timeAgo(dateString) {
  if (!dateString) return "—";
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}