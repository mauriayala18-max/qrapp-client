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
