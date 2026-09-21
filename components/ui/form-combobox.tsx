"use client";

import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type ComboOption = { value: string; label: string };

// THE select for every form in the app. One cmdk combobox owns the full
// contract — type-to-filter, Enter/click to pick, Esc to dismiss,
// blur-reconcile, invalid-state, accessible name — so future forms get
// it by importing this, never by reimplementing picker logic per form.
// (Replaces FormSelect: same value/options shape, searchable trigger.)
export function FormCombobox({
  value,
  onValueChange,
  options,
  placeholder,
  label,
  invalid,
  id,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: ComboOption[];
  placeholder?: string;
  label?: string;
  invalid?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) ?? null;
  // Free typing filters; the input always displays the selection, not
  // the draft — drafts live here until picked or reverted.
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? selected?.label ?? "";

  function pick(next: string) {
    onValueChange(next);
    setDraft(null);
    setOpen(false);
  }

  // Blur reconcile: text matching no option reverts to the selection
  // (empty stays empty) so free text can never leak an invalid value
  // into a Zod enum downstream.
  function reconcile(text: string) {
    if (text.trim() === "") {
      if (value !== "") pick("");
      return;
    }
    const match = options.find(
      (o) =>
        o.label.toLowerCase() === text.trim().toLowerCase() ||
        o.value === text.trim()
    );
    if (match) {
      if (match.value !== value) pick(match.value);
      else setDraft(null);
    } else {
      setDraft(null);
    }
  }

  return (
    <Command
      shouldFilter={false}
      label={label}
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          reconcile(draft ?? shown);
          setOpen(false);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setDraft(null);
          setOpen(false);
        }
      }}
    >
      <CommandInput
        id={id}
        placeholder={placeholder}
        value={shown}
        onValueChange={(text) => {
          setDraft(text);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
        aria-invalid={invalid || undefined}
        aria-label={label}
      />
      {open && (
        <CommandList className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-y-auto border bg-popover shadow-md">
          <CommandEmpty>No matches.</CommandEmpty>
          <CommandGroup>
            {options
              .filter(
                (o) =>
                  draft === null ||
                  draft.trim() === "" ||
                  o.label.toLowerCase().includes(draft.trim().toLowerCase()) ||
                  o.value.toLowerCase().includes(draft.trim().toLowerCase())
              )
              .map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.value}
                  keywords={[o.label]}
                  onSelect={() => pick(o.value)}
                >
                  {o.label}
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      )}
    </Command>
  );
}
