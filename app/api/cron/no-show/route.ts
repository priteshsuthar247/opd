import { NextResponse } from "next/server";
import { flagAllNoShows } from "@/lib/no-show";
import { todayStr } from "@/lib/dates";

// Vercel Cron (vercel.json) hits this every 15 minutes so no-show
// flagging doesn't depend on someone rendering a queue page. Guarded by
// CRON_SECRET in production; unset locally means open (dev only).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`)
      return NextResponse.json({ ok: false }, { status: 401 });
  }
  const flagged = await flagAllNoShows(todayStr());
  return NextResponse.json({ ok: true, flagged });
}
