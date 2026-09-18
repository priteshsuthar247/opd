"use client";

import { useState } from "react";
import { BellIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NotificationRow } from "@/db/queries/notifications";
import { markAllNotificationsRead } from "@/app/notifications/actions";

function timeAgo(iso: string | Date): string {
  const mins = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  );
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationsBell({
  unreadCount,
  items,
}: {
  unreadCount: number;
  items: NotificationRow[];
}) {
  const [clearing, setClearing] = useState(false);

  async function onClear() {
    setClearing(true);
    try {
      await markAllNotificationsRead();
    } catch {
      toast.error("Could not clear notifications.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Notifications" className="relative">
            <BellIcon />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between">
            Notifications
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs font-normal text-muted-foreground underline underline-offset-2"
                disabled={clearing}
                onClick={onClear}
              >
                Mark all read
              </button>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {items.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            Nothing yet — bookings, turn calls and follow-ups land here.
          </p>
        )}
        {items.map((n) => (
          <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5">
            <span
              className={
                n.status === "unread" ? "font-medium" : "text-muted-foreground"
              }
            >
              {n.message}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {n.type.replaceAll("_", " ")} · {timeAgo(n.createdAt)}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
