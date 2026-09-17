"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
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

type NavItem = { href: string; label: string };

const navByRole: Record<ShellRole, { section: string; items: NavItem[] }[]> = {
  admin: [
    {
      section: "Administration",
      items: [
        { href: "/admin", label: "Overview" },
        { href: "/admin/departments", label: "Departments" },
        { href: "/admin/doctors", label: "Doctors" },
        { href: "/admin/medicines", label: "Medicines" },
        { href: "/admin/categories", label: "Categories" },
        { href: "/admin/billing-items", label: "Billing Items" },
        { href: "/admin/queue", label: "Queue Config" },
        { href: "/admin/settings", label: "Settings" },
        { href: "/admin/reports", label: "Reports" },
      ],
    },
    {
      section: "Front Desk",
      items: [
        { href: "/reception", label: "Desk Home" },
        { href: "/reception/patients", label: "Patients" },
        { href: "/reception/book", label: "Book" },
        { href: "/reception/queue", label: "Queue Board" },
      ],
    },
  ],
  doctor: [
    {
      section: "Clinical",
      items: [{ href: "/doctor/queue", label: "My Queue" }],
    },
  ],
  receptionist: [
    {
      section: "Front Desk",
      items: [
        { href: "/reception", label: "Desk Home" },
        { href: "/reception/patients", label: "Patients" },
        { href: "/reception/book", label: "Book" },
        { href: "/reception/queue", label: "Queue Board" },
      ],
    },
  ],
};

export function AppShell({
  role,
  userName,
  children,
}: {
  role: ShellRole;
  userName: string;
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
                {g.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={
                        item.href === "/admin" || item.href === "/reception"
                          ? pathname === item.href
                          : pathname === item.href ||
                            pathname.startsWith(`${item.href}/`)
                      }
                      render={<Link href={item.href}>{item.label}</Link>}
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <div className="flex flex-col gap-1 px-1">
            <p className="truncate px-2 text-xs font-medium">{userName}</p>
            <Badge variant="secondary" className="w-fit">
              {role}
            </Badge>
            <SignOutButton />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center gap-2 border-b p-2">
          <SidebarTrigger />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
