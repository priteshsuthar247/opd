"use client";

import { useFormDialog } from "@/components/ui/form-dialog";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { StatusField } from "@/components/ui/form-fields";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormCombobox } from "@/components/ui/form-combobox";
import { Input } from "@/components/ui/input";
import type { QueueConfigRow } from "@/db/queries/queue-configs";
import {
  queueConfigSchema,
  type QueueConfigFormValues,
} from "@/lib/validations/queue-config";
import { createQueueConfig, updateQueueConfig } from "@/app/admin/queue/actions";

export function QueueConfigDialog({
  config,
  doctors,
  open,
  onOpenChange,
}: {
  config?: QueueConfigRow;
  doctors: { id: number; name: string }[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { controlled, openState, setOpenState } = useFormDialog({
    open,
    onOpenChange,
  });
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
    setOpenState(next);
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
    setOpenState(false);
  }

  return (
    <FormDialog
      open={openState}
      onOpenChange={handleOpenChange}
      triggerLabel={controlled ? undefined : isEdit ? "Edit" : "Add configuration"}
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
                  render={({ field, fieldState }) => (
                    <FormCombobox
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                      label="Doctor"
                      invalid={!!fieldState.error}
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
            <StatusField control={control} error={errors.status} />
          </FieldGroup>
    </FormDialog>
  );
}
