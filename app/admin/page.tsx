import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const sections = [
  {
    href: "/admin/departments",
    title: "Departments",
    description: "Clinical specialties doctors belong to.",
  },
  {
    href: "/admin/doctors",
    title: "Doctors",
    description: "Profiles, fees, working hours and logins.",
  },
  {
    href: "/admin/medicines",
    title: "Medicines",
    description: "Catalog used when building prescriptions.",
  },
  {
    href: "/admin/categories",
    title: "Categories",
    description: "Diagnosis, symptom and complaint values.",
  },
  {
    href: "/admin/billing-items",
    title: "Billing Items",
    description: "Reusable fee line items for invoices.",
  },
  {
    href: "/admin/queue",
    title: "Queue Configuration",
    description: "Slot length and daily token caps per doctor.",
  },
  {
    href: "/admin/settings",
    title: "Settings",
    description: "No-show rules, auto fee and notifications.",
  },
  {
    href: "/admin/reports",
    title: "Reports",
    description: "Daily summary, performance, visits and trends.",
  },
];

export default async function AdminHome() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  return (
    <main className="mx-auto w-full max-w-3xl p-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Administration</h1>
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
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
