import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/shell/app-shell";

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

  return (
    <AppShell
      role={session.user.role === "admin" ? "admin" : "receptionist"}
      userName={session.user.name ?? session.user.email ?? "Front Desk"}
    >
      {children}
    </AppShell>
  );
}
