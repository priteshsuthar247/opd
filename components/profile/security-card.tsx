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
import { Input } from "@/components/ui/input";
import {
  passwordChangeSchema,
  type PasswordChangeInput,
} from "@/lib/validations/profile";
import { changePassword } from "@/app/profile/actions";
import {
  beginTotpSetup,
  confirmTotpSetup,
  deactivateOwnAccount,
  disableTotp,
  regenerateBackupCodes,
  signOutEverywhere,
} from "@/app/profile/totp-actions";

// Security card: password change (existing flow), TOTP two-factor
// lifecycle, sign-out-everywhere, and the self-deactivation danger zone.
export function SecurityCard({ totpEnabled }: { totpEnabled: boolean }) {
  const passForm = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
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

  async function onBeginSetup() {
    setBusy(true);
    try {
      const result = await beginTotpSetup();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setQrSvg(result.qrSvg);
      setManualSecret(result.secret);
      setBackupCodes(null);
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmSetup() {
    setBusy(true);
    try {
      const result = await confirmTotpSetup({ code: confirmCode });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setBackupCodes(result.backupCodes);
      setQrSvg(null);
      setManualSecret(null);
      setConfirmCode("");
      toast.success("Two-factor enabled.");
    } finally {
      setBusy(false);
    }
  }

  async function onNewBackupCodes() {
    if (!pw) {
      toast.error("Enter your password first.");
      return;
    }
    setBusy(true);
    try {
      const result = await regenerateBackupCodes(pw);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setBackupCodes(result.backupCodes);
      setPw("");
      toast.success("New backup codes issued. Old ones are dead.");
    } finally {
      setBusy(false);
    }
  }

  async function onDisableTotp() {
    if (!pw) {
      toast.error("Enter your password first.");
      return;
    }
    setBusy(true);
    try {
      const result = await disableTotp({ password: pw });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      // Server state flipped (enabled=false); reload so the card swaps
      // back to the Enable CTA instead of showing stale actions.
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
            {totpEnabled
              ? "Authenticator app required at every sign-in."
              : "Add an authenticator app as a second step."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!totpEnabled && qrSvg === null && (
            <Button
              className="w-fit"
              variant="outline"
              disabled={busy}
              onClick={onBeginSetup}
            >
              Enable two-factor
            </Button>
          )}
          {qrSvg !== null && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Scan with your authenticator app, then enter the code.
              </p>
              <div
                className="w-fit border bg-white p-2"
                // SVG generated server-side from our own otpauth URL.
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              {manualSecret && (
                <p className="text-xs text-muted-foreground">
                  Manual entry: <code>{manualSecret}</code>
                </p>
              )}
              <div className="flex gap-2">
                <Input
                  inputMode="numeric"
                  placeholder="123456"
                  aria-label="Authenticator code"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  className="max-w-40"
                />
                <Button disabled={busy} onClick={onConfirmSetup} className="w-fit">
                  Confirm
                </Button>
              </div>
            </div>
          )}
          {backupCodes !== null && (
            <div className="flex flex-col gap-2 border p-3">
              <p className="text-xs font-medium">
                Backup codes — shown once, store them safely:
              </p>
              <ul className="grid grid-cols-2 gap-1 font-mono text-xs">
                {backupCodes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {totpEnabled && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="w-fit"
                  disabled={busy}
                  onClick={onNewBackupCodes}
                >
                  New backup codes
                </Button>
                <Button
                  variant="destructive"
                  className="w-fit"
                  disabled={busy}
                  onClick={onDisableTotp}
                >
                  Disable two-factor
                </Button>
              </div>
              <Field>
                <FieldLabel htmlFor="sec-password">
                  Password (for the actions above)
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
          <Button
            variant="outline"
            className="w-fit"
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
