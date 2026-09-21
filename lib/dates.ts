// Local calendar-day string (YYYY-MM-DD). Repeated inline in pages
// before; a shared helper keeps "today" semantics identical everywhere.
export function todayStr(from = new Date()): string {
  const m = String(from.getMonth() + 1).padStart(2, "0");
  const day = String(from.getDate()).padStart(2, "0");
  return `${from.getFullYear()}-${m}-${day}`;
}

// Whole-year age on a YYYY-MM-DD birth date. Lives here (not in a table
// component) so every table/picker imports it from one side-effect-free
// module — cross-importing it between client components broke at runtime
// under Turbopack.
export function ageOn(dob: string | null): string {
  if (!dob) return "—";
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "—";
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age < 0 ? "—" : String(age);
}
