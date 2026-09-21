"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import {
  appointmentSchema,
  type AppointmentFormValues,
} from "@/lib/validations/appointment";
import { createAppointment } from "@/app/reception/book/actions";
import {
  searchPatientOptions,
  type PatientOption,
} from "@/app/reception/patients/actions";
import { todayStr } from "@/lib/dates";

export type DoctorOption = {
  id: number;
  name: string;
  department: string;
  fee: string;
};

export function BookingForm({ doctors }: { doctors: DoctorOption[] }) {
  const [patientQuery, setPatientQuery] = useState("");
  const [options, setOptions] = useState<PatientOption[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const [booked, setBooked] = useState<{ token: number; date: string } | null>(
    null
  );
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: 0,
      doctorId: 0,
      date: todayStr(),
      type: "walk_in",
    },
  });


  // Debounced in the change handler (not an effect): the set-state-in
  // effect rule rejects the useEffect + setTimeout shape.
  function handlePatientQueryChange(value: string) {
    setPatientQuery(value);
    setSearched(false);
    // A new keystroke after a pick invalidates the picked patient.
    if (watch("patientId") !== 0)
      setValue("patientId", 0, { shouldValidate: true });
    if (debounce.current) clearTimeout(debounce.current);
    if (value.trim().length < 2) {
      setOptions([]);
      setPickerOpen(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      setOptions(await searchPatientOptions(value.trim()));
      setSearched(true);
      setPickerOpen(true);
      // Results arriving can drop input focus (stale row click,
      // re-render) — restore it so arrow/Enter work immediately.
      // getElementById because the ref would stop at the CommandInput
      // wrapper instead of reaching the native input.
      document.getElementById("book-patient")?.focus();
    }, 250);
  }

  function pickPatient(p: PatientOption) {
    setValue("patientId", p.id, { shouldValidate: true });
    setPatientQuery(`${p.name} · ${p.phone}`);
    setPickerOpen(false);
  }

  async function onSubmit(data: AppointmentFormValues) {
    const result = await createAppointment(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Token ${result.token} booked.`);
    setBooked({ token: result.token, date: data.date });
  }

  function bookAnother() {
    reset({ patientId: 0, doctorId: 0, date: todayStr(), type: "walk_in" });
    setPatientQuery("");
    setOptions([]);
    setBooked(null);
  }

  if (booked) {
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Token {booked.token} booked</CardTitle>
          <CardDescription>For {booked.date}. The patient is in queue.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={bookAnother}>Book another</Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/reception/queue">View queue</Link>}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Book appointment</CardTitle>
        <CardDescription>
          Token is assigned per doctor, per day.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.patientId}>
              <FieldLabel htmlFor="book-patient">Patient</FieldLabel>
              {/* cmdk combobox: arrow-key navigation, Enter to pick, and
              Esc to dismiss come from the primitive — the old blur-timer
              + preventDefault hack is gone. */}
              <Command
                shouldFilter={false}
                label="Patient"
                className="relative"
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget))
                    setPickerOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setPickerOpen(false);
                }}
              >
                <CommandInput
                  id="book-patient"
                  placeholder="Type at least 2 letters of name or phone…"
                  value={patientQuery}
                  onValueChange={handlePatientQueryChange}
                  onFocus={() => options.length > 0 && setPickerOpen(true)}
                  autoFocus
                  autoComplete="off"
                  aria-invalid={!!errors.patientId}
                />
                {pickerOpen && searched && (
                  <CommandList className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 border bg-popover shadow-md">
                    <CommandEmpty>
                      No patients found —{" "}
                      <Link
                        href="/reception/patients"
                        className="underline"
                      >
                        register them first
                      </Link>
                      .
                    </CommandEmpty>
                    <CommandGroup>
                      {options.map((o) => (
                        <CommandItem
                          key={o.id}
                          value={`${o.name} ${o.phone}`}
                          onSelect={() => pickPatient(o)}
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
              <FieldError errors={[errors.patientId]} />
            </Field>
            <Field data-invalid={!!errors.doctorId}>
              <FieldLabel>Doctor</FieldLabel>
              <Controller
                control={control}
                name="doctorId"
                render={({ field }) => (
                  <FormSelect
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                    label="Doctor"
                    options={doctors.map((d) => ({
                      value: String(d.id),
                      label: `${d.name} · ${d.department} · ₹${Number(d.fee).toFixed(2)}`,
                    }))}
                    placeholder="Pick…"
                  />
                )}
              />
              <FieldError errors={[errors.doctorId]} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!errors.date}>
                <FieldLabel htmlFor="book-date">Date</FieldLabel>
                <Input
                  id="book-date"
                  type="date"
                  min={todayStr()}
                  aria-invalid={!!errors.date}
                  {...register("date")}
                />
                <FieldError errors={[errors.date]} />
              </Field>
              <Field data-invalid={!!errors.type}>
                <FieldLabel>Type</FieldLabel>
                <Controller
                  control={control}
                  name="type"
                render={({ field }) => (
                  <FormSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    label="Type"
                    options={[
                      { value: "walk_in", label: "Walk-in" },
                      { value: "scheduled", label: "Scheduled" },
                    ]}
                  />
                )}
                />
                <FieldError errors={[errors.type]} />
              </Field>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Booking…" : "Book token"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
