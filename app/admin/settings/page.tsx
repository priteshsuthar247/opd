import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listSettings } from "@/db/queries/settings";
import { SettingsTable } from "@/components/admin/settings-table";

export default async function SettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const settings = await listSettings();

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-xs text-muted-foreground">
          No-show rules, auto fee and notification switches.
        </p>
      </div>
      <SettingsTable data={settings} />
    </main>
  );
}
