import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const roleHome = {
  admin: "/admin",
  doctor: "/doctor/queue",
  receptionist: "/reception",
} as const;

export default async function Home() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || !role) redirect("/login");
  redirect(roleHome[role]);
}
