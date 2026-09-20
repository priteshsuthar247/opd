import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/shell/app-shell";
import {
  countUnreadNotifications,
  listRecentNotifications,
} from "@/db/queries/notifications";

export default async function ReceptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (
    session?.user?.role !== "receptionist" &&
    session?.user?.role !== "admin"
  )
    redirect("/");

  const [unreadCount, notifications] = await Promise.all([
    countUnreadNotifications(session.user.role),
    listRecentNotifications(session.user.role),
  ]);

  return (
    <AppShell
      role={session.user.role === "admin" ? "admin" : "receptionist"}
      userName={session.user.name ?? session.user.email ?? "Front Desk"}
      userEmail={session.user.email ?? ""}
      unreadCount={unreadCount}
      notifications={notifications}
    >
      {children}
    </AppShell>
  );
}
