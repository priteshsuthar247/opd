import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { recentActivity } from "@/lib/activity";
import { IdentityCard } from "@/components/profile/identity-card";
import { SecurityCard } from "@/components/profile/security-card";
import { ActivityCard } from "@/components/profile/activity-card";

export default async function SettingsProfilePage() {
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
      emailOtp2fa: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  if (!user) redirect("/login");
  const activity = await recentActivity(Number(session.user.id));

  const fmt = (d: Date | string | null) =>
    d ? new Date(d).toLocaleString() : "—";

  return (
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
      <SecurityCard twoFactorEnabled={user.emailOtp2fa} />
      <ActivityCard activity={activity} />
    </div>
  );
}
