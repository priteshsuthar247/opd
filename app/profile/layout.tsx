import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell, type ShellRole } from "@/components/shell/app-shell";
import {
  countUnreadNotifications,
  listRecentNotifications,
} from "@/db/queries/notifications";

export default async function ProfileLayout({
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
      {children}
    </AppShell>
  );
}
