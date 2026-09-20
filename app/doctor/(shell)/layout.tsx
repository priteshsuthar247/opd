import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/shell/app-shell";
import {
  countUnreadNotifications,
  listRecentNotifications,
} from "@/db/queries/notifications";

export default async function DoctorShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.role !== "doctor") redirect("/");

  const [unreadCount, notifications] = await Promise.all([
    countUnreadNotifications("doctor"),
    listRecentNotifications("doctor"),
  ]);

  return (
    <AppShell
      role="doctor"
      userName={session.user.name ?? session.user.email ?? "Doctor"}
      userEmail={session.user.email ?? ""}
      unreadCount={unreadCount}
      notifications={notifications}
    >
      {children}
    </AppShell>
  );
}
