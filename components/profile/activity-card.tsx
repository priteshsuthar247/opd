import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ACTION_LABELS: Record<string, string> = {
  login: "Signed in",
  name_changed: "Display name changed",
  username_changed: "Username changed",
  email_changed: "Email changed",
  password_changed: "Password changed",
  totp_enabled: "Two-factor enabled",
  totp_disabled: "Two-factor disabled",
  backup_regenerated: "Backup codes regenerated",
  backup_used: "Backup code used",
  sessions_revoked: "Signed out everywhere",
  account_deactivated: "Account deactivated",
};

// Reverse-chronological account audit for the profile page, grouped by
// day (Today / Yesterday / date). Unknown future actions fall back to
// the raw key so logging never breaks the UI.
export function ActivityCard({
  activity,
}: {
  activity: { id: number; action: string; createdAt: Date | string }[];
}) {
  const dayKey = (d: Date | string) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  };
  const dayLabel = (key: string) => {
    const today = new Date();
    const fmt = (dt: Date) =>
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    if (key === fmt(today)) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (key === fmt(yesterday)) return "Yesterday";
    return key;
  };
  const groups = new Map<string, typeof activity>();
  for (const a of activity) {
    const key = dayKey(a.createdAt);
    const list = groups.get(key) ?? [];
    list.push(a);
    groups.set(key, list);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>
          Sign-ins and security changes on this account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No activity recorded yet.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {[...groups.entries()].map(([day, items]) => (
              <section key={day} aria-label={dayLabel(day)}>
                <h3 className="mb-1 text-xs font-medium text-muted-foreground">
                  {dayLabel(day)}
                </h3>
                <ol className="flex flex-col gap-1.5">
                  {items.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-baseline justify-between gap-3 text-xs"
                    >
                      <span className="font-medium">
                        {ACTION_LABELS[a.action] ?? a.action}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {new Date(a.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
