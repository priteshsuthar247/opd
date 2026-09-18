"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QueueConfigRow } from "@/db/queries/queue-configs";
import {
  queueConfigSchema,
  type QueueConfigFormValues,
} from "@/lib/validations/queue-config";
import { createQueueConfig, updateQueueConfig } from "@/app/admin/queue/actions";
import { idLabelMap, statusLabels } from "@/lib/options";

export function QueueConfigDialog({
  config,
  doctors,
}: {
  config?: QueueConfigRow;
  doctors: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!config;
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QueueConfigFormValues>({
    resolver: zodResolver(queueConfigSchema),
    defaultValues: {
      doctorId: config?.doctorId ?? 0,
      slotDurationMinutes: config?.slotDurationMinutes ?? 15,
      maxTokensPerDay: config?.maxTokensPerDay ?? 40,
      status: config?.status ?? "active",
    },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next)
      reset({
        doctorId: config?.doctorId ?? 0,
        slotDurationMinutes: config?.slotDurationMinutes ?? 15,
        maxTokensPerDay: config?.maxTokensPerDay ?? 40,
        status: config?.status ?? "active",
      });
  }

  async function onSubmit(data: QueueConfigFormValues) {
    const result = isEdit
      ? await updateQueueConfig({ ...data, id: config.id })
      : await createQueueConfig(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Configuration updated." : "Configuration created.");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant={isEdit ? "outline" : "default"} size="sm">
            {isEdit ? "Edit" : "Add configuration"}
          </Button>
        }
      />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit queue configuration" : "Add queue configuration"}
          </DialogTitle>
          <DialogDescription>
            Slot length and daily token cap drive token assignment per doctor.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            {isEdit ? (
              <Field>
                <FieldLabel>Doctor</FieldLabel>
                <Input value={config.doctor.user.name} disabled />
              </Field>
            ) : (
              <Field data-invalid={!!errors.doctorId}>
                <FieldLabel>Doctor</FieldLabel>
                <Controller
                  control={control}
                  name="doctorId"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                      items={idLabelMap(doctors)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pick…" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.doctorId]} />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!errors.slotDurationMinutes}>
                <FieldLabel htmlFor="qc-slot">Slot (min)</FieldLabel>
              <Input
                id="qc-slot"
                inputMode="numeric"
                autoFocus
                {...register("slotDurationMinutes")}
                />
                <FieldError errors={[errors.slotDurationMinutes]} />
              </Field>
              <Field data-invalid={!!errors.maxTokensPerDay}>
                <FieldLabel htmlFor="qc-max">Max tokens/day</FieldLabel>
                <Input
                  id="qc-max"
                  inputMode="numeric"
                  {...register("maxTokensPerDay")}
                />
                <FieldError errors={[errors.maxTokensPerDay]} />
              </Field>
            </div>
            <Field data-invalid={!!errors.status}>
              <FieldLabel>Status</FieldLabel>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={statusLabels}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.status]} />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
