import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/shell/app-shell";
import {
  countUnreadNotifications,
  listRecentNotifications,
} from "@/db/queries/notifications";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const [unreadCount, notifications] = await Promise.all([
    countUnreadNotifications("admin"),
    listRecentNotifications("admin"),
  ]);

  return (
    <AppShell
      role="admin"
      userName={session.user.name ?? session.user.email ?? "Admin"}
      userEmail={session.user.email ?? ""}
      unreadCount={unreadCount}
      notifications={notifications}
    >
      {children}
    </AppShell>
  );
}
