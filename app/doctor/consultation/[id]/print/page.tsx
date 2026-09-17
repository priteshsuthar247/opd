import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { doctors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getConsultationBundle } from "@/db/queries/clinical";
import { PrintButton } from "@/components/consultation/print-button";

// Client-side printable prescription: the browser's Print → Save as PDF
// is the export path (per plan: no server-side file storage). This page is
// intentionally chrome-free so only the document prints.
export default async function PrescriptionPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "doctor") redirect("/");
  const doctor = await db.query.doctors.findFirst({
    where: eq(doctors.userId, Number(session.user.id)),
  });
  if (!doctor) redirect("/");

  const { id } = await params;
  const appointmentId = Number(id);
  if (!Number.isInteger(appointmentId)) redirect("/doctor/queue");

  const bundle = await getConsultationBundle(appointmentId);
  if (!bundle || bundle.doctorId !== doctor.id || !bundle.consultation)
    redirect("/doctor/queue");
  const { consultation, patient } = bundle;
  const prescription = consultation.prescription;

  return (
    <main className="mx-auto w-full max-w-2xl bg-white p-6 text-sm text-black">
      <div className="mb-4 flex items-start justify-between border-b pb-3">
        <div>
          <h1 className="text-lg font-semibold">{bundle.doctor.user.name}</h1>
          <p className="text-xs">
            {bundle.doctor.qualification ?? ""}
            {bundle.doctor.registrationNo
              ? ` · Reg. ${bundle.doctor.registrationNo}`
              : ""}
          </p>
          <p className="text-xs">{bundle.doctor.department.name}</p>
        </div>
        <PrintButton />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <p>
          <span className="font-medium">Patient:</span> {patient.name} ·{" "}
          {patient.phone}
        </p>
        <p>
          <span className="font-medium">Date:</span> {bundle.date} · Token{" "}
          {bundle.tokenNumber}
        </p>
        {consultation.diagnosis && (
          <p className="col-span-2">
            <span className="font-medium">Diagnosis:</span>{" "}
            {consultation.diagnosis}
          </p>
        )}
        {consultation.chiefComplaint && (
          <p className="col-span-2">
            <span className="font-medium">Complaint:</span>{" "}
            {consultation.chiefComplaint}
          </p>
        )}
      </div>

      {prescription && prescription.items.length > 0 ? (
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b">
              <th className="py-1 text-left font-medium">#</th>
              <th className="py-1 text-left font-medium">Medicine</th>
              <th className="py-1 text-left font-medium">Dosage</th>
              <th className="py-1 text-left font-medium">Frequency</th>
              <th className="py-1 text-left font-medium">Duration</th>
            </tr>
          </thead>
          <tbody>
            {prescription.items.map((item, idx) => (
              <tr key={item.id} className="border-b">
                <td className="py-1">{idx + 1}</td>
                <td className="py-1">
                  {item.medicine?.name ?? item.freeTextName ?? "—"}
                  {item.instructions ? ` (${item.instructions})` : ""}
                </td>
                <td className="py-1">{item.dosage}</td>
                <td className="py-1">{item.frequency}</td>
                <td className="py-1">{item.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-xs">No medicines prescribed.</p>
      )}

      {consultation.notes && (
        <p className="mt-3 text-xs">
          <span className="font-medium">Notes:</span> {consultation.notes}
        </p>
      )}
      {consultation.followUpRequired && (
        <p className="mt-1 text-xs">
          <span className="font-medium">Follow-up:</span>{" "}
          {consultation.followUpDate ?? "required"}
        </p>
      )}

      <div className="mt-8 flex justify-between text-xs">
        <span>
          Status: {prescription?.status ?? "no prescription"}
        </span>
        <span className="font-medium">{bundle.doctor.user.name}</span>
      </div>
    </main>
  );
}
