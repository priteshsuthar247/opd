import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listQueueConfigs } from "@/db/queries/queue-configs";
import { listDoctors } from "@/db/queries/doctors";
import { QueueConfigDialog } from "@/components/admin/queue-config-dialog";
import { QueueConfigsTable } from "@/components/admin/queue-configs-table";

export default async function QueuePage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const [configs, doctors] = await Promise.all([
    listQueueConfigs(),
    listDoctors(),
  ]);
  const configuredIds = new Set(configs.map((c) => c.doctorId));
  const eligibleDoctors = doctors
    .filter((d) => d.status === "active" && !configuredIds.has(d.id))
    .map((d) => ({ id: d.id, name: d.user.name }));

  return (
    <main className="mx-auto w-full max-w-4xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Queue Configuration</h1>
          <p className="text-xs text-muted-foreground">
            {configs.length} configuration{configs.length === 1 ? "" : "s"}
          </p>
        </div>
        {configs.length > 0 && eligibleDoctors.length > 0 && (
          <QueueConfigDialog doctors={eligibleDoctors} />
        )}
      </div>
      {doctors.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Add a doctor first — configurations belong to one.
          </p>
        </div>
      ) : (
        <QueueConfigsTable data={configs} doctors={eligibleDoctors} />
      )}
    </main>
  );
}
