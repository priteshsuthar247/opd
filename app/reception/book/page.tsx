import { redirect } from "next/navigation";
import { requireRole } from "@/lib/roles";
import { listDoctors } from "@/db/queries/doctors";
import { BookingForm } from "@/components/reception/booking-form";

export default async function BookPage() {
  if (!(await requireRole("receptionist", "admin"))) redirect("/");

  const doctors = await listDoctors();
  const options = doctors
    .filter((d) => d.status === "active")
    .map((d) => ({
      id: d.id,
      name: d.user.name,
      department: d.department.name,
      fee: d.consultationFee,
    }));

  return (
    <main className="mx-auto w-full max-w-3xl p-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Book Appointment</h1>
        <p className="text-xs text-muted-foreground">
          Walk-in or scheduled token against a doctor.
        </p>
      </div>
      {options.length === 0 ? (
        <div className="flex max-w-md flex-col items-center gap-3 border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No active doctors to book against yet.
          </p>
        </div>
      ) : (
        <BookingForm doctors={options} />
      )}
    </main>
  );
}
