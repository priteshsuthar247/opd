"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Live queue board: revalidates the route segment on an interval so new
// bookings, turn calls, and no-show flags appear without manual refresh.
// Rendered inside the queue sections (both roles).
export function QueueRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
