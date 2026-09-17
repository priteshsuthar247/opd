"use client";

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
  SettingsIcon,
  StethoscopeIcon,
  TagsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { Breadcrumbs } from "@/components/shell/breadcrumbs";
import {
  NotificationsBell,
} from "@/components/shell/notifications-bell";
import { UserMenu } from "@/components/shell/user-menu";
import type { NotificationRow } from "@/db/queries/notifications";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export type ShellRole = "admin" | "doctor" | "receptionist";

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
        { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
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
  unreadCount,
  notifications,
  children,
}: {
  role: ShellRole;
  userName: string;
  unreadCount: number;
  notifications: NotificationRow[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const groups = navByRole[role];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <p className="px-2 py-1 font-heading text-sm font-medium">
            OPD Clinic
          </p>
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
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center gap-2 border-b px-2 py-1.5">
          <SidebarTrigger />
          <div className="min-w-0 flex-1">
            <Breadcrumbs />
          </div>
          <NotificationsBell unreadCount={unreadCount} items={notifications} />
          <UserMenu userName={userName} role={role} />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
