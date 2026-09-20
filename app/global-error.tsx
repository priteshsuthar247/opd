"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// Last-resort boundary for errors thrown above every segment (root
// layout). Segment error.tsx files handle their own areas; this catches
// what escapes them, logs the digest, and offers recovery.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled app error:", error.digest ?? error.message);
  }, [error]);

  return (
    <html>
      <body>
        <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            The clinic app hit an unexpected error. Your data is safe —
            try again, or go back and continue.
          </p>
          <div className="flex gap-2">
            <Button onClick={reset}>Try again</Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/">Go home</Link>}
            />
          </div>
        </div>
      </body>
    </html>
  );
}
