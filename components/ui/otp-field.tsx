"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const SLOTS = [0, 1, 2, 3, 4, 5];

// THE one-time-code input for the whole app. Six slots, numeric mode,
// paste-to-fill and auto-advance come from the input-otp primitive;
// RHF wiring, label, and invalid state live here once so the four OTP
// call sites (reset, login 2FA, profile 2FA, email change) never
// reimplement them.
export function OtpField<T extends FieldValues>({
  control,
  name,
  label,
  error,
  autoFocus,
  value,
  onChange,
  id,
}: {
  control?: Control<T>;
  name?: Path<T>;
  label: string;
  error?: { message?: string };
  autoFocus?: boolean;
  // Uncontrolled mode (no RHF): value + onChange instead of control + name.
  value?: string;
  onChange?: (value: string) => void;
  id?: string;
}) {
  const inputId = id ?? `otp-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  // RHF mode keeps label + invalid + error wiring in one place.
  if (control && name) {
    return (
      <Field data-invalid={!!error}>
        <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <OtpSlots
              id={inputId}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              invalid={!!error}
              autoFocus={autoFocus}
            />
          )}
        />
        <FieldError errors={[error]} />
      </Field>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <OtpSlots
        id={inputId}
        value={value ?? ""}
        onChange={onChange}
      />
    </div>
  );
}

function OtpSlots({
  id,
  value,
  onChange,
  onBlur,
  invalid,
  autoFocus,
}: {
  id?: string;
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <InputOTP
      id={id}
      maxLength={6}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      aria-invalid={invalid || undefined}
      autoFocus={autoFocus}
    >
      <InputOTPGroup>
        {SLOTS.map((i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
