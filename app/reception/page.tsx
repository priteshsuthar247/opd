import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/roles";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const sections = [
  {
    href: "/reception/patients",
    title: "Patients",
    description: "Register and find patients by name or phone.",
  },
  {
    href: "/reception/book",
    title: "Book Appointment",
    description: "Walk-in or scheduled token against a doctor.",
  },
  {
    href: "/reception/queue",
    title: "Queue Board",
    description: "Live per-doctor queue for today.",
  },
];

export default async function ReceptionHome() {
  const session = await requireRole("receptionist", "admin");
  if (!session) redirect("/");

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Front Desk</h1>
        <p className="text-xs text-muted-foreground">
          Signed in as {session.user.name ?? session.user.email}.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full transition-colors hover:border-ring">
              <CardHeader>
                <CardTitle>{s.title}</CardTitle>
                <CardDescription>{s.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
