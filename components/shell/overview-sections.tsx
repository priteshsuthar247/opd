import { cache } from "react";
import { WalletIcon } from "lucide-react";
import { listAppointmentsInRange } from "@/db/queries/reports";
import { RecentVisits } from "@/components/shell/recent-visits";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Streaming sections for the admin overview: stat cards paint from a
// light COUNT query while these load the full day bundle behind
// skeletons. Both sections share one cached fetch per request —
// React.cache dedupes the day-bundle query across boundaries.
const getDayRows = cache((date: string) =>
  listAppointmentsInRange({ from: date, to: date })
);

export async function RecentVisitsSection({ date }: { date: string }) {
  const rows = await getDayRows(date);
  const recent = [...rows]
    .sort((a, b) => b.tokenNumber - a.tokenNumber)
    .slice(0, 5);
  return (
    <RecentVisits
      title="Recent visits today"
      viewAllHref="/admin/reports/daily"
      empty="No visits today yet."
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

export async function CollectedSection({ date }: { date: string }) {
  const rows = await getDayRows(date);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Collected today</CardTitle>
        <WalletIcon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          ₹
          {rows
            .reduce((s, r) => s + Number(r.invoice?.totalAmount ?? 0), 0)
            .toFixed(2)}
        </div>
      </CardContent>
    </Card>
  );
}
