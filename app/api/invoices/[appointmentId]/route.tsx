import { NextResponse } from "next/server";
import { render } from "takumi-pdf";
import { googleFonts } from "@takumi-rs/helpers";
import { requireRole } from "@/lib/roles";
import { getInvoiceBundle } from "@/db/queries/invoices";
import { InvoicePdf } from "@/components/billing/invoice-pdf";

// Invoice PDF download (pdfcn/Takumi). A route handler, not a Server
// Action — actions cannot return binary bytes. Same role rules as the
// retired print page (receptionist or admin); any appointment with an
// invoice can download.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const session = await requireRole("receptionist", "admin");
  if (!session)
    return NextResponse.json({ ok: false }, { status: 401 });

  const { appointmentId } = await params;
  const id = Number(appointmentId);
  if (!Number.isInteger(id))
    return NextResponse.json({ ok: false }, { status: 400 });

  const bundle = await getInvoiceBundle(id);
  if (!bundle || !bundle.invoice)
    return NextResponse.json({ ok: false }, { status: 404 });

  // Inter covers the ₹ glyph (the default font does not) — fetched
  // once per request from Google Fonts.
  const pdf = await render(<InvoicePdf bundle={bundle} />, {
    size: "a4",
    fonts: await googleFonts(["Inter"]),
  });
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-token-${bundle.tokenNumber}.pdf"`,
    },
  });
}
