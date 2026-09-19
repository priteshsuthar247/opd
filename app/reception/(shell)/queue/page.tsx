import { redirect } from "next/navigation";
import { requireRole } from "@/lib/roles";
import { flagNoShows } from "@/lib/no-show";
import { listDoctors } from "@/db/queries/doctors";
import { listQueue } from "@/db/queries/appointments";
import { QueueTable } from "@/components/queue/queue-table";
import {
  FilterApply,
  FilterBar,
  FilterField,
} from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { todayStr } from "@/lib/dates";

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
  // Lazy no-show pass over the visible scope before rendering.
  const flagged = (
    await Promise.all(
      (doctorId !== undefined
        ? activeDoctors.filter((d) => d.id === doctorId)
        : activeDoctors
      ).map((d) => flagNoShows(d.id, date))
    )
  ).reduce((s, n) => s + n, 0);
  const rowsAfterFlag =
    flagged > 0 ? await listQueue(date, doctorId) : rows;

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Queue Board</h1>
        <p className="text-xs text-muted-foreground">
          {rowsAfterFlag.length} appointment{rowsAfterFlag.length === 1 ? "" : "s"} · {date}
          {flagged > 0 && ` · ${flagged} marked no-show`}
        </p>
      </div>
      {/* Plain GET form: filter without client JS. */}
      <FilterBar action="/reception/queue">
        <FilterField label="Doctor">
          <Select
            name="doctor"
            defaultValue={doctorId ? String(doctorId) : "all"}
            items={{
              all: "All doctors",
              ...Object.fromEntries(
                activeDoctors.map((d) => [String(d.id), d.user.name])
              ),
            }}
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
        </FilterField>
        <FilterField label="Date">
          <Input type="date" name="date" defaultValue={date} className="w-40" />
        </FilterField>
        <FilterApply />
      </FilterBar>
      <QueueTable data={rowsAfterFlag} />
    </main>
  );
}
