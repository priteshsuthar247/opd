import { redirect } from "next/navigation";
import { requireRole } from "@/lib/roles";
import { listDoctors } from "@/db/queries/doctors";
import { listQueue } from "@/db/queries/appointments";
import { QueueTable } from "@/components/queue/queue-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string; date?: string }>;
}) {
  if (!(await requireRole("receptionist", "admin"))) redirect("/");

  const params = await searchParams;
  const date =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : todayStr();
  const doctorId =
    params.doctor && /^\d+$/.test(params.doctor)
      ? Number(params.doctor)
      : undefined;

  const [doctors, rows] = await Promise.all([
    listDoctors(),
    listQueue(date, doctorId),
  ]);
  const activeDoctors = doctors.filter((d) => d.status === "active");

  return (
    <main className="mx-auto w-full max-w-4xl p-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Queue Board</h1>
        <p className="text-xs text-muted-foreground">
          {rows.length} appointment{rows.length === 1 ? "" : "s"} · {date}
        </p>
      </div>
      {/* Plain GET form: filter without client JS. */}
      <form
        action="/reception/queue"
        method="get"
        className="mb-4 flex flex-wrap items-end gap-2"
      >
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Doctor</span>
          <Select
            name="doctor"
            defaultValue={doctorId ? String(doctorId) : "all"}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All doctors</SelectItem>
              {activeDoctors.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Date</span>
          <Input type="date" name="date" defaultValue={date} className="w-40" />
        </label>
        <Button type="submit" variant="outline" size="sm">
          Apply
        </Button>
      </form>
      <QueueTable data={rows} />
    </main>
  );
}
