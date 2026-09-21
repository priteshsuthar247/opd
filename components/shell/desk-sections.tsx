import { cache } from "react";
import { listAppointmentsInRange } from "@/db/queries/reports";
import { RecentVisits } from "@/components/shell/recent-visits";

// Streaming recent bookings for the reception desk home: stat cards
// paint from a light COUNT query while this loads the day bundle.
// Cached per request so sibling boundaries share one fetch.
export const getDeskDayRows = cache((date: string) =>
  listAppointmentsInRange({ from: date, to: date })
);

export async function DeskRecentSection({ date }: { date: string }) {
  const rows = await getDeskDayRows(date);
  const recent = [...rows]
    .sort((a, b) => b.tokenNumber - a.tokenNumber)
    .slice(0, 5);
  return (
    <RecentVisits
      title="Recent bookings"
      viewAllHref="/reception/queue"
      empty="Nothing booked today yet."
      visits={recent.map((r) => ({
        id: r.id,
        tokenNumber: r.tokenNumber,
        patientName: r.patient.name,
        doctorName: r.doctor.user.name,
        status: r.status,
      }))}
    />
  );
}
