"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  otpVerifySchema,
  passwordResetSchema,
  resetRequestSchema,
  type OtpVerifyInput,
  type PasswordResetInput,
  type ResetRequestInput,
} from "@/lib/validations/password-reset";
import {
  requestOtp,
  resetPassword,
  verifyOtp,
} from "@/app/(auth)/forgot-password/actions";

type Step = "request" | "verify" | "reset" | "done";

// Three-step password reset on one card: identifier → 6-digit OTP →
// new password. Steps advance only on ok:true; every failure shows the
// server message without revealing account existence.
export function ResetPasswordForm() {
  const [step, setStep] = useState<Step>("request");
  const [identifier, setIdentifier] = useState("");
  const [resetToken, setResetToken] = useState("");

  const requestForm = useForm<ResetRequestInput>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { identifier: "" },
  });
  const verifyForm = useForm<OtpVerifyInput>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { identifier: "", otp: "" },
  });
  const resetForm = useForm<PasswordResetInput>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { resetToken: "", password: "", confirmPassword: "" },
  });

  async function onRequest(data: ResetRequestInput) {
    const result = await requestOtp(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setIdentifier(data.identifier);
    verifyForm.setValue("identifier", data.identifier);
    setStep("verify");
    toast.success("If an account exists, a code was sent.");
  }

  async function onVerify(data: OtpVerifyInput) {
    const result = await verifyOtp(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setResetToken(result.resetToken);
    resetForm.setValue("resetToken", result.resetToken);
    setStep("reset");
  }

  async function onReset(data: PasswordResetInput) {
    const result = await resetPassword(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setStep("done");
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>
          {step === "request" && "Enter your username or email to get a code."}
          {step === "verify" && "Enter the 6-digit code from your email."}
          {step === "reset" && "Choose a new password."}
          {step === "done" && "Password updated."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "request" && (
          <form onSubmit={requestForm.handleSubmit(onRequest)}>
            <FieldGroup>
              <Field
                data-invalid={!!requestForm.formState.errors.identifier}
              >
                <FieldLabel htmlFor="reset-identifier">
                  Username or email
                </FieldLabel>
                <Input
                  id="reset-identifier"
                  autoComplete="username"
                  autoFocus
                  placeholder="aisha.verma"
                  aria-invalid={!!requestForm.formState.errors.identifier}
                  {...requestForm.register("identifier")}
                />
                <FieldError
                  errors={[requestForm.formState.errors.identifier]}
                />
              </Field>
              <Button
                type="submit"
                className="w-full"
                disabled={requestForm.formState.isSubmitting}
              >
                {requestForm.formState.isSubmitting
                  ? "Sending…"
                  : "Send code"}
              </Button>
            </FieldGroup>
          </form>
        )}
        {step === "verify" && (
          <form onSubmit={verifyForm.handleSubmit(onVerify)}>
            <FieldGroup>
              <Field data-invalid={!!verifyForm.formState.errors.otp}>
                <FieldLabel htmlFor="reset-otp">6-digit code</FieldLabel>
                <Input
                  id="reset-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder="123456"
                  aria-invalid={!!verifyForm.formState.errors.otp}
                  {...verifyForm.register("otp")}
                />
                <FieldError errors={[verifyForm.formState.errors.otp]} />
              </Field>
              <Button
                type="submit"
                className="w-full"
                disabled={verifyForm.formState.isSubmitting}
              >
                {verifyForm.formState.isSubmitting
                  ? "Verifying…"
                  : "Verify code"}
              </Button>
            </FieldGroup>
          </form>
        )}
        {step === "reset" && (
          <form onSubmit={resetForm.handleSubmit(onReset)}>
            <FieldGroup>
              <Field data-invalid={!!resetForm.formState.errors.password}>
                <FieldLabel htmlFor="reset-password">New password</FieldLabel>
                <PasswordInput
                  id="reset-password"
                  autoComplete="new-password"
                  autoFocus
                  aria-invalid={!!resetForm.formState.errors.password}
                  {...resetForm.register("password")}
                />
                <FieldError errors={[resetForm.formState.errors.password]} />
              </Field>
              <Field
                data-invalid={!!resetForm.formState.errors.confirmPassword}
              >
                <FieldLabel htmlFor="reset-confirm">
                  Confirm password
                </FieldLabel>
                <PasswordInput
                  id="reset-confirm"
                  autoComplete="new-password"
                  aria-invalid={!!resetForm.formState.errors.confirmPassword}
                  {...resetForm.register("confirmPassword")}
                />
                <FieldError
                  errors={[resetForm.formState.errors.confirmPassword]}
                />
              </Field>
              <Button
                type="submit"
                className="w-full"
                disabled={resetForm.formState.isSubmitting}
              >
                {resetForm.formState.isSubmitting
                  ? "Saving…"
                  : "Set new password"}
              </Button>
            </FieldGroup>
          </form>
        )}
        {step === "done" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Your password was changed for {identifier}. All other sessions
              were signed out — sign in again below.
            </p>
            <Button
              className="w-full"
              nativeButton={false}
              render={<Link href="/login">Back to sign in</Link>}
            />
          </div>
        )}
        {step !== "done" && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link href="/login" className="underline">
              Back to sign in
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
