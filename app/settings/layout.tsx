import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell, type ShellRole } from "@/components/shell/app-shell";
import {
  countUnreadNotifications,
  listRecentNotifications,
} from "@/db/queries/notifications";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (
    session.user.role === "admin" ? "admin" : session.user.role
  ) as ShellRole;
  const [unreadCount, notifications] = await Promise.all([
    countUnreadNotifications(session.user.role),
    listRecentNotifications(session.user.role),
  ]);

  return (
    <AppShell
      role={role}
      userName={session.user.name ?? session.user.email ?? "Account"}
      userEmail={session.user.email ?? ""}
      unreadCount={unreadCount}
      notifications={notifications}
    >
      <main className="mx-auto w-full max-w-2xl p-4 md:p-6">
        <div className="mb-4">
          <h1 className="text-lg font-semibold">Settings</h1>
          <p className="text-xs text-muted-foreground">
            Your profile, appearance, and account activity.
          </p>
        </div>
        <SettingsTabs />
        <div className="mt-4">{children}</div>
      </main>
    </AppShell>
  );
}
