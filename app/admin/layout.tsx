import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/shell/app-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  return (
    <AppShell
      role="admin"
      userName={session.user.name ?? session.user.email ?? "Admin"}
    >
      {children}
    </AppShell>
  );
}
