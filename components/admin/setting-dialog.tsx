"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            Edit
          </Button>
        }
      />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit setting</DialogTitle>
          <DialogDescription>
            {settingDescriptions[setting.key as keyof typeof settingDescriptions] ??
              setting.key}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
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
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
