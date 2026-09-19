// Local calendar-day string (YYYY-MM-DD). Repeated inline in pages
// before; a shared helper keeps "today" semantics identical everywhere.
export function todayStr(from = new Date()): string {
  const m = String(from.getMonth() + 1).padStart(2, "0");
  const day = String(from.getDate()).padStart(2, "0");
  return `${from.getFullYear()}-${m}-${day}`;
}
