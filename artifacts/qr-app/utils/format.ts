/**
 * Format a number as Guaraníes with dot thousands separators: "25.000 Gs."
 */
export function formatGs(value: number | null | undefined): string {
  const n = Math.round(Number(value) || 0);
  const formatted = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formatted} Gs.`;
}

/**
 * Format prep time as "~15 min".
 */
export function formatPrepTime(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return "";
  return `~${minutes} min`;
}

/**
 * Format a rating with one decimal: 4.5
 */
export function formatRating(rating?: number | null): string {
  if (rating == null) return "—";
  return rating.toFixed(1);
}

/**
 * Relative time in Spanish: "hace 5 min", "hace 2 h", "ayer".
 */
export function formatTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return "";
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "recién";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  return `hace ${days} días`;
}

/**
 * Group label for a date: "Hoy", "Ayer" or "12 jun 2026".
 */
const MONTHS_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export function formatDateLabel(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Hoy";
  if (sameDay(d, yest)) return "Ayer";
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
}
