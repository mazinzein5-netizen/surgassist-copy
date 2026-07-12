/**
 * Builds a clinical shift context string from the current user's settings.
 * Included at the top of clinical notes (admission notes, case notes) with date/time.
 */
export function buildShiftContext(user) {
  if (!user) return "";
  const now = new Date();
  const dateStr = now.toLocaleString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts = [];
  if (user.hospital) parts.push(`Hospital: ${user.hospital}`);
  if (user.department) parts.push(`Department: ${user.department.replace(/_/g, " ")}`);
  if (user.on_call_mode) {
    parts.push("On-Call: Yes");
    if (user.cross_cover_departments?.length > 0) {
      const depts = user.cross_cover_departments.map((d) => d.replace(/_/g, " ")).join(", ");
      parts.push(`Cross-Cover: ${depts}`);
    }
  }
  parts.push(`Date/Time: ${dateStr}`);
  return parts.join(" | ");
}

/**
 * Returns a human-readable summary of shift context for display in UI.
 */
export function shiftContextSummary(user) {
  if (!user) return "";
  const parts = [];
  if (user.hospital) parts.push(user.hospital);
  if (user.department) parts.push(user.department.replace(/_/g, " "));
  if (user.on_call_mode) {
    parts.push("On-Call");
    if (user.cross_cover_departments?.length > 0) {
      parts.push(`Cross-cover: ${user.cross_cover_departments.map((d) => d.replace(/_/g, " ")).join(", ")}`);
    }
  }
  return parts.join(" · ");
}