"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { departments } from "@/db/schema";
import {
  departmentSchema,
  departmentStatusSchema,
  departmentUpdateSchema,
} from "@/lib/validations/department";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "admin";
}

// Drizzle surfaces Postgres errors with a `code` property (23505 = unique
// violation). Narrowed without `any` per repo convention.
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "23505"
  );
}

const PATH = "/admin/departments";

export async function createDepartment(input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = departmentSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  try {
    await db.insert(departments).values(parsed.data);
  } catch (err) {
    if (isUniqueViolation(err))
      return { ok: false, error: "A department with this code already exists." };
    return { ok: false, error: "Could not create the department." };
  }
  revalidatePath(PATH);
  return { ok: true };
}

export async function updateDepartment(input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = departmentUpdateSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { id, ...patch } = parsed.data;
  try {
    await db.update(departments).set(patch).where(eq(departments.id, id));
  } catch (err) {
    if (isUniqueViolation(err))
      return { ok: false, error: "A department with this code already exists." };
    return { ok: false, error: "Could not update the department." };
  }
  revalidatePath(PATH);
  return { ok: true };
}

export async function setDepartmentStatus(
  input: unknown
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = departmentStatusSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  await db
    .update(departments)
    .set({ status: parsed.data.status })
    .where(eq(departments.id, parsed.data.id));
  revalidatePath(PATH);
  return { ok: true };
}
