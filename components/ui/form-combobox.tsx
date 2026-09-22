"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export type ComboOption = { value: string; label: string };

// THE select for every form in the app. Built on the official shadcn
// Combobox (Base UI, portal-positioned popup) — not a hand-rolled cmdk
// inline list, which clips inside dialogs. One parent owns the contract
// (type-to-filter, pick, invalid, accessible name) so future forms get
// it by importing this, never by reimplementing picker logic per form.
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
  // Object items with label mapping (no createItems collection needed
  // for static option lists); the string value maps back on select.
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Combobox
      items={options}
      itemToStringLabel={(o: ComboOption) => o.label}
      value={selected}
      onValueChange={(item) =>
        onValueChange(item ? (item as ComboOption).value : "")
      }
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder ?? (selected ? selected.label : "Pick…")}
        aria-label={label}
        aria-invalid={invalid || undefined}
        autoComplete="off"
      />
      <ComboboxContent>
        <ComboboxEmpty>No matches.</ComboboxEmpty>
        <ComboboxList>
          {(item: ComboOption) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
