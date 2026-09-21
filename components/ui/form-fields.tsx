"use client";

import {
  Controller,
  type Control,
  type FieldError as RHFError,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { FormCombobox } from "@/components/ui/form-combobox";
import { Input } from "@/components/ui/input";
import { statusOptions } from "@/lib/options";

type MaybeError = RHFError | undefined;

// Single-line text field: label, input, inline error in one call.
export function TextField({
  label,
  error,
  ...props
}: { label: string; error?: MaybeError } & React.ComponentProps<
  typeof Input
>) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={props.id}>{label}</FieldLabel>
      <Input aria-invalid={!!error} {...props} />
      <FieldError errors={[error]} />
    </Field>
  );
}

// The active/inactive select shared by every master form.
export function StatusField<T extends FieldValues>({
  control,
  error,
}: {
  control: Control<T>;
  error?: MaybeError;
}) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel>Status</FieldLabel>
      <Controller
        control={control}
        name={"status" as Path<T>}
        render={({ field, fieldState }) => (
          <FormCombobox
            value={(field.value as string) ?? ""}
            onValueChange={field.onChange}
            options={[...statusOptions]}
            label="Status"
            invalid={!!fieldState.error}
          />
        )}
      />
      <FieldError errors={[error]} />
    </Field>
  );
}
