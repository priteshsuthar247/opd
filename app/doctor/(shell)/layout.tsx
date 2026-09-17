import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/shell/app-shell";

export default async function DoctorShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.role !== "doctor") redirect("/");

  return (
    <AppShell
      role="doctor"
      userName={session.user.name ?? session.user.email ?? "Doctor"}
    >
      {children}
    </AppShell>
  );
}
