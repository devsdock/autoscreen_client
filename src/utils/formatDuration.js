/**
 * Convert raw minutes into a human-readable duration string.
 * e.g. 30 → "30 min", 60 → "1 hr", 90 → "1 hr 30 min", 120 → "2 hrs"
 */
export function formatDuration(mins) {
  if (!mins || mins <= 0) return "0 min";
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  if (hours === 0) return `${remainder} min`;
  if (remainder === 0) return hours === 1 ? "1 hr" : `${hours} hrs`;
  return `${hours} hr ${String(remainder).padStart(2, "0")} min`;
}
