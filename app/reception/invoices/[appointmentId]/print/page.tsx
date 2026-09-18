import { redirect } from "next/navigation";
import { requireRole } from "@/lib/roles";
import { getInvoiceBundle } from "@/db/queries/invoices";
import { PrintButton } from "@/components/consultation/print-button";

// Client-side printable invoice: browser Print to PDF, no server storage.
// Chrome-free on purpose; lives outside the (shell) group.
export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  if (!(await requireRole("receptionist", "admin"))) redirect("/");
  const { appointmentId } = await params;
  const id = Number(appointmentId);
  if (!Number.isInteger(id)) redirect("/reception/queue");

  const bundle = await getInvoiceBundle(id);
  if (!bundle || !bundle.invoice) redirect("/reception/queue");
  const invoice = bundle.invoice;
  const money = (v: string | number) => Number(v).toFixed(2);

  return (
    <main className="mx-auto w-full max-w-2xl bg-white p-6 text-sm text-black">
      <div className="mb-4 flex items-start justify-between border-b pb-3">
        <div>
          <h1 className="text-lg font-semibold">OPD Clinic</h1>
          <p className="text-xs">Consultation Invoice</p>
        </div>
        <PrintButton />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <p>
          <span className="font-medium">Patient:</span> {bundle.patient.name} ·{" "}
          {bundle.patient.phone}
        </p>
        <p>
          <span className="font-medium">Date:</span> {bundle.date} · Token{" "}
          {bundle.tokenNumber}
        </p>
        <p>
          <span className="font-medium">Doctor:</span> {bundle.doctor.user.name} ·{" "}
          {bundle.doctor.department.name}
        </p>
        <p>
          <span className="font-medium">Payment:</span>{" "}
          {invoice.paymentStatus === "paid" ? "Paid" : "Pending"}
          {invoice.paymentMode ? ` · ${invoice.paymentMode}` : ""}
        </p>
      </div>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b">
            <th className="py-1 text-left font-medium">#</th>
            <th className="py-1 text-left font-medium">Item</th>
            <th className="py-1 text-right font-medium">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-1">1</td>
            <td className="py-1">Consultation fee</td>
            <td className="py-1 text-right">
              {money(invoice.consultationFee)}
            </td>
          </tr>
          {invoice.items.map((item, idx) => (
            <tr key={item.id} className="border-b">
              <td className="py-1">{idx + 2}</td>
              <td className="py-1">{item.name}</td>
              <td className="py-1 text-right">{money(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex flex-col gap-1 text-xs">
        <p className="flex justify-between">
          <span>Discount</span>
          <span>₹{money(invoice.discount)}</span>
        </p>
        <p className="flex justify-between font-medium">
          <span>Total</span>
          <span>₹{money(invoice.totalAmount)}</span>
        </p>
      </div>

      <div className="mt-8 flex justify-between text-xs">
        <span>Appointment #{bundle.id}</span>
        <span className="font-medium">Received with thanks</span>
      </div>
    </main>
  );
}
