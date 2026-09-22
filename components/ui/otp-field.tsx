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
}: {
  control?: Control<T>;
  name?: Path<T>;
  label: string;
  error?: { message?: string };
  autoFocus?: boolean;
  // Uncontrolled mode (no RHF): value + onChange instead of control + name.
  value?: string;
  onChange?: (value: string) => void;
}) {
  // RHF mode keeps label + invalid + error wiring in one place.
  if (control && name) {
    return (
      <Field data-invalid={!!error}>
        <FieldLabel>{label}</FieldLabel>
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <OtpSlots
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
      <span className="text-sm font-medium">{label}</span>
      <OtpSlots value={value ?? ""} onChange={onChange} />
    </div>
  );
}

function OtpSlots({
  value,
  onChange,
  onBlur,
  invalid,
  autoFocus,
}: {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <InputOTP
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
