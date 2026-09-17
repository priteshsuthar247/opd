"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Human labels for known segments; dynamic ids fall back to a titleized
// segment so new routes degrade gracefully instead of breaking.
const labels: Record<string, string> = {
  admin: "Administration",
  doctor: "Doctor",
  reception: "Front Desk",
  departments: "Departments",
  doctors: "Doctors",
  medicines: "Medicines",
  categories: "Categories",
  "billing-items": "Billing Items",
  queue: "Queue",
  settings: "Settings",
  reports: "Reports",
  daily: "Daily Summary",
  "doctor-performance": "Doctor Performance",
  "patient-visit": "Patient Visits",
  "diagnosis-trend": "Diagnosis Trend",
  custom: "Custom",
  patients: "Patients",
  book: "Book",
  invoices: "Invoices",
  consultation: "Consultation",
  print: "Print",
};

function titleize(segment: string): string {
  return segment
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((seg, i) => {
          const href = `/${segments.slice(0, i + 1).join("/")}`;
          const isLast = i === segments.length - 1;
          const label = /^\d+$/.test(seg)
            ? `#${seg}`
            : (labels[seg] ?? titleize(seg));
          return (
            <Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
