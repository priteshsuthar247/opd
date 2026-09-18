import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ProfileForms } from "@/components/profile/profile-forms";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = await db.query.users.findFirst({
    where: eq(users.id, Number(session.user.id)),
    columns: { name: true, email: true, role: true, createdAt: true },
  });
  if (!user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-2xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Profile</h1>
          <p className="text-xs text-muted-foreground">
            Your account and sign-in security.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/">Back to home</Link>}
        />
      </div>
      <ProfileForms
        name={user.name}
        email={user.email}
        role={user.role}
        memberSince={new Date(user.createdAt).toLocaleDateString()}
      />
    </main>
  );
}
