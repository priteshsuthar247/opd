"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import type { QueueRow } from "@/db/queries/appointments";
import { rescheduleAppointment } from "@/app/reception/queue/actions";

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const formSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
    .refine((d) => d >= todayStr(), "Date cannot be in the past"),
});

export function RescheduleDialog({ row }: { row: QueueRow }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ date: string }>({
    resolver: zodResolver(formSchema),
    defaultValues: { date: row.date },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) reset({ date: row.date });
  }

  async function onSubmit(data: { date: string }) {
    if (data.date === row.date) {
      toast.error("Already booked for this date.");
      return;
    }
    const result = await rescheduleAppointment({ id: row.id, date: data.date });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Moved. New token assigned for ${data.date}.`);
    setOpen(false);
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      triggerLabel="Reschedule"
      triggerVariant="ghost"
      title={`Reschedule token ${row.tokenNumber}`}
      description={`${row.patient.name} with ${row.doctor.user.name}. A fresh token is assigned at the end of the new day's queue.`}
      submitLabel="Move appointment"
      busyLabel="Moving…"
      busy={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FieldGroup>
            <Field data-invalid={!!errors.date}>
              <FieldLabel htmlFor="resched-date">New date</FieldLabel>
              <Input
                id="resched-date"
                type="date"
                min={todayStr()}
                autoFocus
                aria-invalid={!!errors.date}
                {...register("date")}
              />
              <FieldError errors={[errors.date]} />
            </Field>
          </FieldGroup>
    </FormDialog>
  );
}
