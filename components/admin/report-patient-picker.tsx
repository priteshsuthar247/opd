"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  searchPatientOptions,
  type PatientOption,
} from "@/app/reception/patients/actions";

function PickerInner({
  basePath,
  preserveParams,
}: {
  basePath: string;
  preserveParams: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<PatientOption[]>([]);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced in the change handler (not an effect): the set-state-in
  // effect rule rejects the useEffect + setTimeout shape.
  function handleQueryChange(value: string) {
    setQuery(value);
    setSearched(false);
    if (debounce.current) clearTimeout(debounce.current);
    if (value.trim().length < 2) {
      setOptions([]);
      setOpen(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      setOptions(await searchPatientOptions(value.trim()));
      setSearched(true);
      setOpen(true);
      document.getElementById("report-patient-search")?.focus();
    }, 250);
  }

  function pick(id: number) {
    if (preserveParams) {
      const next = new URLSearchParams(searchParams.toString());
      next.set("patientId", String(id));
      router.push(`${basePath}?${next.toString()}`);
    } else {
      router.push(`${basePath}?patientId=${id}`);
    }
  }

  return (
    <div className="max-w-xs">
      {/* cmdk combobox (same pattern as the booking picker): keyboard
      nav, Enter to pick, Esc to dismiss — no blur-timer hack. */}
      <Command
        shouldFilter={false}
        label="Patient"
        className="relative"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        <CommandInput
          id="report-patient-search"
          placeholder="Search patient by name or phone…"
          value={query}
          onValueChange={handleQueryChange}
          onFocus={() => options.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {open && searched && (
          <CommandList className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 border bg-popover shadow-md">
            <CommandEmpty>No patients match this search.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={`${o.name} ${o.phone}`}
                  onSelect={() => pick(o.id)}
                >
                  <span className="flex flex-col">
                    <span className="font-medium">{o.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {o.phone}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        )}
      </Command>
    </div>
  );
}

// Self-suspense so callers in server pages don't need a boundary.
export function ReportPatientPicker({
  basePath = "/admin/reports/patient-visit",
  preserveParams = false,
}: {
  basePath?: string;
  preserveParams?: boolean;
}) {
  return (
    <Suspense>
      <PickerInner basePath={basePath} preserveParams={preserveParams} />
    </Suspense>
  );
}
