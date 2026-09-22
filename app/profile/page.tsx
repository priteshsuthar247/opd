import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { recentActivity } from "@/lib/activity";
import { IdentityCard } from "@/components/profile/identity-card";
import { SecurityCard } from "@/components/profile/security-card";
import { ActivityCard } from "@/components/profile/activity-card";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = await db.query.users.findFirst({
    where: eq(users.id, Number(session.user.id)),
    columns: {
      name: true,
      email: true,
      username: true,
      role: true,
      avatarColor: true,
      totpEnabled: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  if (!user) redirect("/login");
  const activity = await recentActivity(Number(session.user.id));

  const fmt = (d: Date | string | null) =>
    d ? new Date(d).toLocaleString() : "—";

  return (
    <main className="mx-auto w-full max-w-2xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Profile</h1>
          <p className="text-xs text-muted-foreground">
            Your identity, sign-in security, and account activity.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/">Back to home</Link>}
        />
      </div>
      <div className="flex flex-col gap-4">
        <IdentityCard
          name={user.name}
          username={user.username}
          email={user.email}
          role={user.role}
          memberSince={new Date(user.createdAt).toLocaleDateString()}
          lastLogin={fmt(user.lastLoginAt)}
          avatarColor={user.avatarColor}
        />
        <SecurityCard totpEnabled={user.totpEnabled} />
        <ActivityCard activity={activity} />
      </div>
    </main>
  );
}
