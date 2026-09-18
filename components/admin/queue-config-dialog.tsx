"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import type { QueueConfigRow } from "@/db/queries/queue-configs";
import {
  queueConfigSchema,
  type QueueConfigFormValues,
} from "@/lib/validations/queue-config";
import { createQueueConfig, updateQueueConfig } from "@/app/admin/queue/actions";
import { statusOptions } from "@/lib/options";

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
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      triggerLabel={isEdit ? "Edit" : "Add configuration"}
      triggerVariant={isEdit ? "outline" : "default"}
      title={isEdit ? "Edit queue configuration" : "Add queue configuration"}
      description="Slot length and daily token cap drive token assignment per doctor."
      submitLabel={isEdit ? "Save changes" : "Create"}
      busy={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
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
                    <FormSelect
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                      options={doctors.map((d) => ({
                        value: String(d.id),
                        label: d.name,
                      }))}
                      placeholder="Pick…"
                    />
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
                  <FormSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    options={[...statusOptions]}
                  />
                )}
              />
              <FieldError errors={[errors.status]} />
            </Field>
          </FieldGroup>
    </FormDialog>
  );
}
