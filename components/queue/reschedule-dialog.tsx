"use client";

import { useFormDialog } from "@/components/ui/form-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import type { QueueRow } from "@/db/queries/appointments";
import { rescheduleAppointment } from "@/app/reception/queue/actions";
import { todayStr } from "@/lib/dates";

const formSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
    .refine((d) => d >= todayStr(), "Date cannot be in the past"),
});

export function RescheduleDialog({
  row,
  open,
  onOpenChange,
}: {
  row: QueueRow;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { controlled, openState, setOpenState } = useFormDialog({
    open,
    onOpenChange,
  });
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
    setOpenState(next);
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
    setOpenState(false);
  }

  return (
    <FormDialog
      open={openState}
      onOpenChange={handleOpenChange}
      triggerLabel={controlled ? undefined : "Reschedule"}
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
