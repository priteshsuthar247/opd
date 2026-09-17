import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/roles";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const reports = [
  {
    href: "/admin/reports/daily",
    title: "Daily OPD Summary",
    description: "Patients seen, average wait, doctor-wise load.",
  },
  {
    href: "/admin/reports/doctor-performance",
    title: "Doctor Performance",
    description: "Patients per day trend and no-show rate.",
  },
  {
    href: "/admin/reports/patient-visit",
    title: "Patient Visit Report",
    description: "Full visit and prescription history per patient.",
  },
  {
    href: "/admin/reports/diagnosis-trend",
    title: "Diagnosis Trend",
    description: "Most common diagnoses across a date range.",
  },
  {
    href: "/admin/reports/custom",
    title: "Custom Report",
    description: "Combine filters and export CSV.",
  },
];

export default async function ReportsIndex() {
  if (!(await requireRole("admin"))) redirect("/");

  return (
    <main className="mx-auto w-full max-w-3xl p-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Reports</h1>
        <p className="text-xs text-muted-foreground">
          Operational and clinical summaries.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {reports.map((r) => (
          <Link key={r.href} href={r.href}>
            <Card className="h-full transition-colors hover:border-ring">
              <CardHeader>
                <CardTitle>{r.title}</CardTitle>
                <CardDescription>{r.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
