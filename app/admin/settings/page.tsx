import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listSettings } from "@/db/queries/settings";
import {
  AutoFeeCard,
  NoShowCard,
  NotificationsCard,
} from "@/components/admin/settings-cards";

function get<T>(rows: { key: string; value: unknown }[], key: string): T | null {
  const row = rows.find((r) => r.key === key);
  if (!row || typeof row.value !== "object" || row.value === null) return null;
  return row.value as T;
}

export default async function SettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const rows = await listSettings();
  const minutes = get<{ minutes: number }>(rows, "no_show_minutes")?.minutes ?? 30;
  const gap = get<{ gap: number }>(rows, "no_show_token_gap")?.gap ?? 3;
  const autoFee = get<{ enabled: boolean }>(rows, "auto_fee_enabled")?.enabled ?? true;
  const notify = get<Record<string, boolean>>(rows, "notifications") ?? {};

  return (
    <main className="mx-auto w-full max-w-2xl p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-xs text-muted-foreground">
          Clinic rules for queue, billing and notifications.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <NoShowCard minutes={minutes} gap={gap} />
        <AutoFeeCard enabled={autoFee} />
        <NotificationsCard
          initial={{
            appointment_booked: notify.appointment_booked ?? true,
            turn_approaching: notify.turn_approaching ?? true,
            prescription_finalized: notify.prescription_finalized ?? true,
            follow_up_due: notify.follow_up_due ?? true,
          }}
        />
      </div>
    </main>
  );
}
