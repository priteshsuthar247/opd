"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
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
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (query.trim().length < 2) {
      setOptions([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      setOptions(await searchPatientOptions(query.trim()));
      setOpen(true);
    }, 250);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

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
    <div className="relative max-w-xs">
      <Input
        placeholder="Search patient by name or phone…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => options.length > 0 && setOpen(true)}
        autoComplete="off"
      />
      {open && options.length > 0 && (
        <div className="absolute z-10 mt-1 w-full border bg-popover">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              className="flex w-full flex-col px-2.5 py-1.5 text-left text-xs hover:bg-muted"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(o.id)}
            >
              <span className="font-medium">{o.name}</span>
              <span className="text-muted-foreground">{o.phone}</span>
            </button>
          ))}
        </div>
      )}
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
