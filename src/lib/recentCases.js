import { base44 } from "@/api/base44Client";

/**
 * Fetches cases with recent activity — edited, commented on (CaseNote),
 * or flagged/reviewed (ReviewLog, including Jack the safety agent).
 * Returns cases sorted by latest activity, with _activity_type / _activity_label.
 */
export async function fetchRecentCases(limit = 30) {
  const [cases, notes, reviews] = await Promise.all([
    base44.entities.CaseFile.filter({}, "-updated_date", 50),
    base44.entities.CaseNote.filter({}, "-created_date", 30).catch(() => []),
    base44.entities.ReviewLog.filter({}, "-created_date", 30).catch(() => []),
  ]);

  // Build activity map: case_id -> { timestamp, type, label }
  const activityMap = {};
  for (const c of cases) {
    activityMap[c.id] = {
      timestamp: new Date(c.updated_date || c.created_date),
      type: "edited",
      label: "Edited",
    };
  }
  for (const n of notes) {
    if (!n.case_id) continue;
    const ts = new Date(n.created_date);
    if (!activityMap[n.case_id] || ts > activityMap[n.case_id].timestamp) {
      activityMap[n.case_id] = { timestamp: ts, type: "commented", label: "Commented" };
    }
  }
  for (const r of reviews) {
    if (!r.case_id) continue;
    const ts = new Date(r.created_date);
    const isJack = (r.reviewer_name || "").toLowerCase().includes("jack");
    if (!activityMap[r.case_id] || ts > activityMap[r.case_id].timestamp) {
      activityMap[r.case_id] = {
        timestamp: ts,
        type: isJack ? "flagged" : "reviewed",
        label: isJack ? "Flagged by Jack" : "Reviewed",
      };
    }
  }

  // Fetch cases that have notes/reviews but weren't in the top-50 by updated_date
  const knownIds = new Set(cases.map((c) => c.id));
  const missingIds = [...new Set([...notes, ...reviews].map((n) => n.case_id))].filter(
    (id) => id && !knownIds.has(id)
  );
  const missingCases = (
    await Promise.all(missingIds.map((id) => base44.entities.CaseFile.get(id).catch(() => null)))
  ).filter(Boolean);

  const allCases = [...cases, ...missingCases];
  const withActivity = allCases.map((c) => ({
    ...c,
    _latest_activity: activityMap[c.id]?.timestamp || new Date(c.updated_date || c.created_date),
    _activity_type: activityMap[c.id]?.type || "edited",
    _activity_label: activityMap[c.id]?.label || "Edited",
  }));

  withActivity.sort((a, b) => new Date(b._latest_activity) - new Date(a._latest_activity));
  return withActivity.slice(0, limit);
}