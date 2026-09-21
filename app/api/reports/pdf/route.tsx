import { NextResponse } from "next/server";
import { render } from "takumi-pdf";
import { googleFonts } from "@takumi-rs/helpers";
import { requireRole } from "@/lib/roles";
import {
  buildCustomReport,
  buildDailyReport,
  buildPatientVisitsReport,
  buildPerformanceReport,
  buildTrendReport,
  type ReportTable,
} from "@/lib/report-data";
import { ReportPdf } from "@/components/reports/report-pdf";

// Admin report PDFs (pdfcn/Takumi): ?report=daily&date=…,
// ?report=trend&from=…&to=…, ?report=performance&…,
// ?report=custom&… (all custom filters), ?report=visits&patientId=….
// Admin-only. Builders mirror the streaming sections' logic (same
// queries, same filters) so PDF, CSV, and screen agree.
export async function GET(request: Request) {
  if (!(await requireRole("admin")))
    return NextResponse.json({ ok: false }, { status: 401 });

  const q = new URL(request.url).searchParams;
  const kind = q.get("report");
  const num = (s: string | null) =>
    s !== null && /^\d+$/.test(s) ? Number(s) : undefined;
  const okDate = (s: string | null) =>
    s !== null && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined;

  let report: ReportTable | null = null;
  let filename = "report";
  if (kind === "daily") {
    const date = okDate(q.get("date"));
    if (!date) return NextResponse.json({ ok: false }, { status: 400 });
    report = await buildDailyReport(date);
    filename = `daily-${date}`;
  } else if (kind === "trend" || kind === "performance") {
    const from = okDate(q.get("from"));
    const to = okDate(q.get("to"));
    if (!from || !to) return NextResponse.json({ ok: false }, { status: 400 });
    report =
      kind === "trend"
        ? await buildTrendReport(from, to)
        : await buildPerformanceReport(from, to);
    filename = `${kind}-${from}-${to}`;
  } else if (kind === "custom") {
    const from = okDate(q.get("from"));
    const to = okDate(q.get("to"));
    if (!from || !to) return NextResponse.json({ ok: false }, { status: 400 });
    const statuses = [
      "waiting",
      "in_progress",
      "completed",
      "cancelled",
      "no_show",
    ] as const;
    const status = q.get("status");
    report = await buildCustomReport({
      departmentId: num(q.get("departmentId")),
      doctorId: num(q.get("doctorId")),
      patientId: num(q.get("patientId")),
      from,
      to,
      status: (statuses as readonly string[]).includes(status ?? "")
        ? (status as (typeof statuses)[number])
        : undefined,
      diagnosis: q.get("diagnosis")?.trim() || undefined,
    });
    filename = `custom-report-${from}-${to}`;
  } else if (kind === "visits") {
    const patientId = num(q.get("patientId"));
    if (patientId === undefined)
      return NextResponse.json({ ok: false }, { status: 400 });
    report = await buildPatientVisitsReport(patientId);
    filename = `patient-${patientId}-visits`;
  } else {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const pdf = await render(<ReportPdf report={report} />, {
    size: "a4",
    fonts: await googleFonts(["Inter"]),
  });
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
    },
  });
}
