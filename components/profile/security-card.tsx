"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
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
import { PasswordInput } from "@/components/ui/password-input";
import { OtpField } from "@/components/ui/otp-field";
import { Input } from "@/components/ui/input";
import {
  passwordChangeSchema,
  type PasswordChangeInput,
} from "@/lib/validations/profile";
import { changePassword } from "@/app/profile/actions";
import {
  confirmTwoFactor,
  deactivateOwnAccount,
  disableTwoFactor,
  requestTwoFactorCode,
  signOutEverywhere,
} from "@/app/profile/actions";

// Security card: password change (existing flow), email-OTP two-factor,
// sign-out-everywhere, and the self-deactivation danger zone.
export function SecurityCard({ twoFactorEnabled }: { twoFactorEnabled: boolean }) {
  const passForm = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const [codeSent, setCodeSent] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState("");
  const [showDanger, setShowDanger] = useState(false);

  async function onPassword(data: PasswordChangeInput) {
    const result = await changePassword(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Password changed. Please sign in again.");
    await signOut({ redirectTo: "/login" });
  }

  async function onRequestCode() {
    setBusy(true);
    try {
      const result = await requestTwoFactorCode();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCodeSent(true);
      toast.success("A code was emailed to you.");
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmSetup() {
    setBusy(true);
    try {
      const result = await confirmTwoFactor({ code: confirmCode });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Two-factor enabled.");
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  async function onDisableTwoFactor() {
    if (!pw) {
      toast.error("Enter your password first.");
      return;
    }
    setBusy(true);
    try {
      const result = await disableTwoFactor({ password: pw });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            You will be signed out on every device and asked to sign in
            again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passForm.handleSubmit(onPassword)}>
            <FieldGroup>
              <Field data-invalid={!!passForm.formState.errors.currentPassword}>
                <FieldLabel htmlFor="pw-current">Current password</FieldLabel>
                <PasswordInput
                  id="pw-current"
                  autoComplete="current-password"
                  aria-invalid={!!passForm.formState.errors.currentPassword}
                  {...passForm.register("currentPassword")}
                />
                <FieldError
                  errors={[passForm.formState.errors.currentPassword]}
                />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field data-invalid={!!passForm.formState.errors.newPassword}>
                  <FieldLabel htmlFor="pw-new">New password</FieldLabel>
                  <PasswordInput
                    id="pw-new"
                    autoComplete="new-password"
                    aria-invalid={!!passForm.formState.errors.newPassword}
                    {...passForm.register("newPassword")}
                  />
                  <FieldError errors={[passForm.formState.errors.newPassword]} />
                </Field>
                <Field
                  data-invalid={!!passForm.formState.errors.confirmPassword}
                >
                  <FieldLabel htmlFor="pw-confirm">Confirm new</FieldLabel>
                  <PasswordInput
                    id="pw-confirm"
                    autoComplete="new-password"
                    aria-invalid={!!passForm.formState.errors.confirmPassword}
                    {...passForm.register("confirmPassword")}
                  />
                  <FieldError
                    errors={[passForm.formState.errors.confirmPassword]}
                  />
                </Field>
              </div>
              <Button
                type="submit"
                disabled={passForm.formState.isSubmitting}
                className="w-fit"
              >
                {passForm.formState.isSubmitting
                  ? "Changing…"
                  : "Change password"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>
            {twoFactorEnabled
              ? "A code is emailed to you at every sign-in."
              : "Get an emailed code as a second step."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!twoFactorEnabled && !codeSent && (
            <Button
              className="w-fit"
              variant="outline"
              disabled={busy}
              onClick={onRequestCode}
            >
              Enable two-factor
            </Button>
          )}
          {!twoFactorEnabled && codeSent && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                We emailed you a 6-digit code — enter it to confirm.
              </p>
              <div className="flex items-end gap-2">
                <OtpField
                  label="Email code"
                  value={confirmCode}
                  onChange={setConfirmCode}
                />
                <Button disabled={busy} onClick={onConfirmSetup} className="w-fit">
                  Confirm
                </Button>
              </div>
            </div>
          )}
          {twoFactorEnabled && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  className="w-fit"
                  disabled={busy}
                  onClick={onDisableTwoFactor}
                >
                  Disable two-factor
                </Button>
              </div>
              <Field>
                <FieldLabel htmlFor="sec-password">
                  Password (to disable)
                </FieldLabel>
                <PasswordInput
                  id="sec-password"
                  autoComplete="current-password"
                  value={pw}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPw(e.target.value)
                  }
                />
              </Field>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>
            Sign-in uses stateless tokens, so individual devices cannot be
            listed — but one action kills them all.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              One action kills every live token, including this browser.
            </p>
            <Button
              variant="outline"
              className="ml-auto w-fit shrink-0"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const result = await signOutEverywhere();
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("All sessions signed out.");
                  await signOut({ redirectTo: "/login" });
                } finally {
                  setBusy(false);
                }
              }}
            >
              Sign out everywhere
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Deactivating locks this login immediately on every device.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {!showDanger ? (
            <Button
              variant="destructive"
              className="w-fit"
              onClick={() => setShowDanger(true)}
            >
              Deactivate my account
            </Button>
          ) : (
            <>
              <Field>
                <FieldLabel htmlFor="danger-password">
                  Confirm with your password
                </FieldLabel>
                <PasswordInput
                  id="danger-password"
                  autoComplete="current-password"
                  value={pw}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPw(e.target.value)
                  }
                />
              </Field>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const result = await deactivateOwnAccount({
                        password: pw,
                      });
                      if (!result.ok) {
                        toast.error(result.error);
                        return;
                      }
                      await signOut({ redirectTo: "/login" });
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Confirm deactivation
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDanger(false);
                    setPw("");
                  }}
                >
                  Back
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
