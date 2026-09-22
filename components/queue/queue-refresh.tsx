"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Live queue board: revalidates the route segment on an interval so new
// bookings, turn calls, and no-show flags appear without manual refresh.
// Rendered inside the queue sections (both roles).
export function QueueRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
      setTick((t) => t + 1);
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return (
    <span className="sr-only" aria-live="polite">
      Queue updated {new Date().toLocaleTimeString()}
    </span>
  );
}
