import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/roles";
import {
  ReceptionQueueSection,
  getActiveDoctors,
} from "@/components/queue/queue-sections";
import {
  FilterApply,
  FilterBar,
  FilterField,
} from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableSkeleton } from "@/components/shell/loading-blocks";
import { todayStr } from "@/lib/dates";

// Live board: never serve a stale CDN copy in production.
export const dynamic = 'force-dynamic';

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

  // Cheap masters query: title + filters paint while the flag pass and
  // queue table stream inside the section below.
  const activeDoctors = await getActiveDoctors();

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Queue Board</h1>
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
              <SelectGroup>
                <SelectLabel>Doctors</SelectLabel>
                <SelectItem value="all">All doctors</SelectItem>
                {activeDoctors.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.user.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Date">
          <Input type="date" name="date" defaultValue={date} className="w-40" />
        </FilterField>
        <FilterApply />
      </FilterBar>
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <ReceptionQueueSection date={date} doctorId={doctorId} />
      </Suspense>
    </main>
  );
}
