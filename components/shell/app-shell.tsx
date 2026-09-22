"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3Icon,
  Building2Icon,
  CalendarPlusIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  ListOrderedIcon,
  PillIcon,
  ReceiptIcon,
  StethoscopeIcon,
  TagsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { NavUser } from "@/components/nav-user";
import {
  CommandPalette,
  type PaletteItem,
} from "@/components/shell/command-palette";
import { NotificationsBell } from "@/components/shell/notifications-bell";
import type { NotificationRow } from "@/db/queries/notifications";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export type ShellRole = "admin" | "doctor" | "receptionist";

// Header title per route, Sigil-style (single title, no breadcrumb trail).
// Dynamic ids fall back to a titleized segment.
const titleMap: Record<string, string> = {
  "/admin": "Overview",
  "/admin/departments": "Departments",
  "/admin/doctors": "Doctors",
  "/admin/medicines": "Medicines",
  "/admin/categories": "Categories",
  "/admin/billing-items": "Billing Items",
  "/admin/queue": "Queue Configuration",
  "/admin/settings": "Settings",
  "/admin/reports": "Reports",
  "/admin/reports/daily": "Daily Summary",
  "/admin/reports/doctor-performance": "Doctor Performance",
  "/admin/reports/patient-visit": "Patient Visits",
  "/admin/reports/diagnosis-trend": "Diagnosis Trend",
  "/admin/reports/custom": "Custom Report",
  "/doctor/queue": "My Queue",
  "/reception": "Front Desk",
  "/reception/patients": "Patients",
  "/reception/book": "Book Appointment",
  "/reception/queue": "Queue Board",
};

function titleFor(pathname: string): string {
  if (titleMap[pathname]) return titleMap[pathname];
  if (pathname.startsWith("/reception/invoices/")) return "Invoice";
  if (pathname.startsWith("/doctor/consultation/")) return "Consultation";
  const last = pathname.split("/").filter(Boolean).pop() ?? "";
  if (/^\d+$/.test(last)) return "Detail";
  return last
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

type NavItem = { href: string; label: string; icon: LucideIcon };

const navByRole: Record<ShellRole, { section: string; items: NavItem[] }[]> = {
  admin: [
    {
      section: "Administration",
      items: [
        { href: "/admin", label: "Overview", icon: LayoutDashboardIcon },
        { href: "/admin/departments", label: "Departments", icon: Building2Icon },
        { href: "/admin/doctors", label: "Doctors", icon: StethoscopeIcon },
        { href: "/admin/medicines", label: "Medicines", icon: PillIcon },
        { href: "/admin/categories", label: "Categories", icon: TagsIcon },
        { href: "/admin/billing-items", label: "Billing Items", icon: ReceiptIcon },
        { href: "/admin/queue", label: "Queue Config", icon: ListOrderedIcon },
        { href: "/admin/reports", label: "Reports", icon: BarChart3Icon },
      ],
    },
    {
      section: "Front Desk",
      items: [
        { href: "/reception", label: "Desk Home", icon: ClipboardListIcon },
        { href: "/reception/patients", label: "Patients", icon: UsersIcon },
        { href: "/reception/book", label: "Book", icon: CalendarPlusIcon },
        { href: "/reception/queue", label: "Queue Board", icon: ListChecksIcon },
      ],
    },
  ],
  doctor: [
    {
      section: "Clinical",
      items: [{ href: "/doctor/queue", label: "My Queue", icon: ListChecksIcon }],
    },
  ],
  receptionist: [
    {
      section: "Front Desk",
      items: [
        { href: "/reception", label: "Desk Home", icon: ClipboardListIcon },
        { href: "/reception/patients", label: "Patients", icon: UsersIcon },
        { href: "/reception/book", label: "Book", icon: CalendarPlusIcon },
        { href: "/reception/queue", label: "Queue Board", icon: ListChecksIcon },
      ],
    },
  ],
};

export function AppShell({
  role,
  userName,
  userEmail,
  unreadCount,
  notifications,
  children,
}: {
  role: ShellRole;
  userName: string;
  userEmail: string;
  unreadCount: number;
  notifications: NotificationRow[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const groups = navByRole[role];
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteItems: PaletteItem[] = groups.flatMap((g) =>
    g.items.map((i) => ({ label: i.label, href: i.href, section: g.section }))
  );

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <Sidebar variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="data-[slot=sidebar-menu-button]:p-1.5!"
                render={<Link href="/" />}
              >
                <StethoscopeIcon className="size-5!" />
                <span className="text-base font-semibold">OPD Clinic</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {groups.map((g) => (
            <div key={g.section}>
              <p className="px-3 pt-2 text-[11px] tracking-wide text-muted-foreground uppercase">
                {g.section}
              </p>
              <SidebarMenu>
                {g.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={
                          item.href === "/admin" || item.href === "/reception"
                            ? pathname === item.href
                            : pathname === item.href ||
                              pathname.startsWith(`${item.href}/`)
                        }
                        tooltip={item.label}
                        render={
                          <Link href={item.href}>
                            <Icon />
                            <span>{item.label}</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={{ name: userName, email: userEmail }} role={role} />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
          <div className="flex w-full items-center gap-2 px-4 lg:gap-3 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mx-2 h-4 data-vertical:self-auto"
            />
            <h1 className="text-base font-medium">{titleFor(pathname)}</h1>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="hidden text-muted-foreground md:inline-flex"
                onClick={() => setPaletteOpen(true)}
              >
                Jump to…
                <kbd className="ml-1 border px-1 text-[10px]">Ctrl K</kbd>
              </Button>
              <NotificationsBell
                unreadCount={unreadCount}
                items={notifications}
              />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
      <CommandPalette
        role={role}
        items={paletteItems}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
      />
    </SidebarProvider>
  );
}
