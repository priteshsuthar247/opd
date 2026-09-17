"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            Reschedule
          </Button>
        }
      />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reschedule token {row.tokenNumber}</DialogTitle>
          <DialogDescription>
            {row.patient.name} with {row.doctor.user.name}. A fresh token is
            assigned at the end of the new day&apos;s queue.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.date}>
              <FieldLabel htmlFor="resched-date">New date</FieldLabel>
              <Input
                id="resched-date"
                type="date"
                min={todayStr()}
                aria-invalid={!!errors.date}
                {...register("date")}
              />
              <FieldError errors={[errors.date]} />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Moving…" : "Move appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
