"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { doctors, queueConfigurations, users } from "@/db/schema";
import { usernameSchema } from "@/lib/validations/user";
import { isUsernameTaken, suggestUsernames } from "@/lib/usernames";
import {
  doctorSchema,
  doctorStatusSchema,
  doctorUpdateSchema,
} from "@/lib/validations/doctor";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "admin";
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "23505"
  );
}

const PATH = "/admin/doctors";

export async function createDoctor(input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = doctorSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { name, email, username, password, ...profile } = parsed.data;
  try {
    // Login account, clinical profile and queue rules are one unit: a
    // doctor with no login (or no queue config) is unusable, so all three
    // rows are created in a single transaction.
    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ name, email, username, passwordHash: await hash(password, 10), role: "doctor" })
        .returning({ id: users.id });
      const [doctor] = await tx
        .insert(doctors)
        .values({ ...profile, userId: user.id })
        .returning({ id: doctors.id });
      await tx.insert(queueConfigurations).values({ doctorId: doctor.id });
    });
  } catch (err) {
    if (isUniqueViolation(err))
      return { ok: false, error: "Email or username just taken — pick another username." };
    return { ok: false, error: "Could not create the doctor." };
  }
  revalidatePath(PATH);
  return { ok: true };
}

export async function updateDoctor(input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = doctorUpdateSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { id, name, email, username, password, ...profile } = parsed.data;
  try {
    await db.transaction(async (tx) => {
      const existing = await tx.query.doctors.findFirst({
        where: eq(doctors.id, id),
      });
      if (!existing) throw new Error("Doctor not found.");
      await tx
        .update(users)
        .set({
          name,
          email,
          username,
          ...(password ? { passwordHash: await hash(password, 10) } : {}),
        })
        .where(eq(users.id, existing.userId));
      await tx.update(doctors).set(profile).where(eq(doctors.id, id));
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Doctor not found.")
      return { ok: false, error: "Doctor not found." };
    if (isUniqueViolation(err))
      return { ok: false, error: "Email or username just taken — pick another username." };
    return { ok: false, error: "Could not update the doctor." };
  }
  revalidatePath(PATH);
  return { ok: true };
}

export async function setDoctorStatus(input: unknown): Promise<ActionResult> {  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = doctorStatusSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  await db.transaction(async (tx) => {
    await tx
      .update(doctors)
      .set({ status: parsed.data.status })
      .where(eq(doctors.id, parsed.data.id));
    // Deactivating the clinical profile also locks the login — an
    // inactive doctor must not keep booking access with a live JWT.
    const [doctor] = await tx
      .select({ userId: doctors.userId })
      .from(doctors)
      .where(eq(doctors.id, parsed.data.id));
    if (doctor) {
      await tx
        .update(users)
        .set({ status: parsed.data.status })
        .where(eq(users.id, doctor.userId));
    }
  });
  revalidatePath(PATH);
  return { ok: true };
}

// Social-style availability check for the doctor dialog: validates the
// handle format, then returns free suggestions when taken. Admin-only;
// the final uniqueness guard is the DB constraint at creation time
// (a handle taken between check and submit fails with a retry message).
export async function checkUsernameAvailability(
  input: unknown
): Promise<
  | { ok: true; available: boolean; suggestions: string[] }
  | { ok: false; error: string }
> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = usernameSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid username." };
  const available = !(await isUsernameTaken(parsed.data));
  return {
    ok: true,
    available,
    suggestions: available ? [] : await suggestUsernames(parsed.data),
  };
}
