import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  // Not logged in at all — send to login for any protected area.
  if (!req.auth) {
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/doctor") ||
      pathname.startsWith("/reception")
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // Deactivated mid-session — force re-login. The jwt callback flips
  // active to false within 5 minutes of a deactivation.
  if (req.auth?.user?.active === false) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Logged in, but wrong role for this section.
  // Admin is intentionally allowed into /reception too — reception
  // is the one area an admin may need to operate directly.
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/doctor") && role !== "doctor") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (
    pathname.startsWith("/reception") &&
    role !== "receptionist" &&
    role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/doctor/:path*", "/reception/:path*"],
};
