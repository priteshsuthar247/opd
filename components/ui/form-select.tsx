"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SelectOption = { value: string; label: string };

// One select for every form in the app. Options go in once as data — the
// component derives both the items and the value-to-label map from them,
// so the closed trigger can never show a raw id again. (Base UI resolves
// the trigger text from mounted popup items and falls back to the raw
// value when the popup is closed; the `items` map below is what fixes it
// centrally instead of per call site.)
export function FormSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        // Single-select clearing yields null; our forms model "empty" as
        // "" (or undefined via an explicit option), never null.
        if (v !== null) onValueChange(v);
      }}
      items={Object.fromEntries(options.map((o) => [o.value, o.label]))}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
