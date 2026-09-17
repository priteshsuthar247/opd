"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { callNextToken } from "@/app/doctor/(shell)/consultation/actions";
import type { ShellRole } from "@/components/shell/app-shell";

export type PaletteItem = { label: string; href: string; section: string };

export function CommandPalette({
  role,
  items,
  open,
  onOpenChange,
}: {
  role: ShellRole;
  items: PaletteItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  async function callNext() {
    onOpenChange(false);
    const result = await callNextToken();
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Token ${result.token} is now in consultation.`);
    router.push(`/doctor/consultation/${result.appointmentId}`);
  }

  const groups = new Map<string, PaletteItem[]>();
  for (const item of items) {
    const list = groups.get(item.section) ?? [];
    list.push(item);
    groups.set(item.section, list);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to… (patients, book, queue)" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>
        {role === "doctor" && (
          <CommandGroup heading="Actions">
            <CommandItem value="call next token" onSelect={() => void callNext()}>
              Call next token
            </CommandItem>
          </CommandGroup>
        )}
        {[...groups.entries()].map(([section, list]) => (
          <CommandGroup key={section} heading={section}>
            {list.map((item) => (
              <CommandItem
                key={item.href}
                value={`${item.label} ${item.section}`}
                onSelect={() => go(item.href)}
              >
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
