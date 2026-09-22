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

// Reverse-chronological account audit for the profile page. Unknown
// future actions fall back to the raw key so logging never breaks the UI.
export function ActivityCard({
  activity,
}: {
  activity: { id: number; action: string; createdAt: Date | string }[];
}) {
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
          <ol className="flex flex-col gap-2">
            {activity.map((a) => (
              <li
                key={a.id}
                className="flex items-baseline justify-between gap-3 text-xs"
              >
                <span className="font-medium">
                  {ACTION_LABELS[a.action] ?? a.action}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
