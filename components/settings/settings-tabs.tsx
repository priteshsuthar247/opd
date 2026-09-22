"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const TABS = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/appearance", label: "Appearance" },
];

// Settings tab nav: plain links with tab styling, active state from the
// pathname. Client-only because active state needs usePathname.
export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings" className="flex gap-1 border-b">
      {TABS.map((t) => {
        const active =
          pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "border-b-2 px-3 py-2 text-sm",
              active
                ? "border-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
