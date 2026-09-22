import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatCard({
  title,
  value,
  icon: Icon,
  href,
  trend,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  href?: string;
  trend?: { value: string; label: string };
}) {

  return (
    <Card className={!href ? "" : "hover:shadow-sm transition-shadow"}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          {trend && (
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          )}
        </div>
        {href && (
          <a href={href} className="mt-2 inline-flex text-xs text-primary hover:underline">
            View
          </a>
        )}
      </CardContent>
    </Card>
  );
}
