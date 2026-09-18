"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SettingRow } from "@/db/queries/settings";
import {
  settingDescriptions,
  settingSchema,
  type SettingInput,
} from "@/lib/validations/settings";
import { updateSetting } from "@/app/admin/settings/actions";

export function SettingDialog({ setting }: { setting: SettingRow }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingInput>({
    resolver: zodResolver(settingSchema),
    defaultValues: {
      key: setting.key as SettingInput["key"],
      valueJson: JSON.stringify(setting.value, null, 2),
    },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next)
      reset({
        key: setting.key as SettingInput["key"],
        valueJson: JSON.stringify(setting.value, null, 2),
      });
  }

  async function onSubmit(data: SettingInput) {
    const result = await updateSetting(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Setting updated.");
    setOpen(false);
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      triggerLabel="Edit"
      triggerVariant="outline"
      title="Edit setting"
      description={
        settingDescriptions[setting.key as keyof typeof settingDescriptions] ??
        setting.key
      }
      submitLabel="Save changes"
      busy={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FieldGroup>
            <Field>
              <FieldLabel htmlFor="set-key">Key</FieldLabel>
              <Input id="set-key" value={setting.key} disabled />
            </Field>
            <Field data-invalid={!!errors.valueJson}>
              <FieldLabel htmlFor="set-value">Value (JSON)</FieldLabel>
              <Textarea
                id="set-value"
                rows={6}
                className="font-mono"
                autoFocus
                aria-invalid={!!errors.valueJson}
                {...register("valueJson")}
              />
              <FieldError errors={[errors.valueJson]} />
            </Field>
          </FieldGroup>
    </FormDialog>
  );
}
