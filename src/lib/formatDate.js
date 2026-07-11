export function formatTimestamp(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.toLocaleDateString("en-IE", { month: "short" });
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} · ${hours}:${minutes}`;
}

export function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const diffM = Math.floor(diffMs / (1000 * 60));
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffD >= 1) return `${diffD}d ago`;
  if (diffH >= 1) return `${diffH}h ago`;
  if (diffM >= 1) return `${diffM}m ago`;
  return "just now";
}