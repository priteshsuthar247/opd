import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

// Username plumbing shared by the availability check, login lookup, and
// seeding. Normalization is lowercase + trim so `Aisha.Verma` and
// `aisha.verma` are the same handle everywhere.
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

// Social-style suggestions for a taken handle: repair the attempt, then
// deterministic variants in order. Resolved with ONE query (no N+1).
export async function suggestUsernames(
  attempt: string,
  count = 3
): Promise<string[]> {
  const base =
    normalizeUsername(attempt).replace(/[^a-z0-9._-]/g, "") || "user";
  const candidates: string[] = [];
  const push = (c: string) => {
    const cut = c.slice(0, 30).replace(/^[._-]+|[._-]+$/g, "") || "user";
    if (cut.length >= 3 && !candidates.includes(cut)) candidates.push(cut);
  };
  push(base);
  let n = 1;
  while (candidates.length < count + 1 && n < 100) {
    push(`${base}${n}`);
    push(`${base}_${n}`);
    push(`${base}.${n}`);
    n++;
  }
  if (candidates.length === 0) return [];
  const taken = await db.query.users.findMany({
    where: inArray(users.username, candidates),
    columns: { username: true },
  });
  const takenSet = new Set(taken.map((t) => t.username));
  return candidates.filter((c) => !takenSet.has(c)).slice(0, count);
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const row = await db.query.users.findFirst({
    where: (t, { eq }) => eq(t.username, normalizeUsername(username)),
    columns: { id: true },
  });
  return row !== undefined;
}
