import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { render } from "takumi-pdf";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { doctors } from "@/db/schema";
import { getConsultationBundle } from "@/db/queries/clinical";
import { PrescriptionPdf } from "@/components/prescription/prescription-pdf";

// Prescription PDF download (pdfcn/Takumi). A route handler, not a
// Server Action — actions cannot return binary bytes. Same role +
// ownership rules as the retired print page: the doctor owns the visit
// and a consultation must exist.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "doctor")
    return NextResponse.json({ ok: false }, { status: 401 });
  const doctor = await db.query.doctors.findFirst({
    where: eq(doctors.userId, Number(session.user.id)),
    columns: { id: true },
  });
  if (!doctor) return NextResponse.json({ ok: false }, { status: 403 });

  const { appointmentId } = await params;
  const id = Number(appointmentId);
  if (!Number.isInteger(id))
    return NextResponse.json({ ok: false }, { status: 400 });

  const bundle = await getConsultationBundle(id);
  if (!bundle || bundle.doctorId !== doctor.id || !bundle.consultation)
    return NextResponse.json({ ok: false }, { status: 404 });

  const pdf = await render(<PrescriptionPdf bundle={bundle} />, {
    size: "a4",
  });
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="prescription-token-${bundle.tokenNumber}.pdf"`,
    },
  });
}
