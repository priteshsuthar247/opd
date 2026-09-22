"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import { checkOtpRequired } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { OtpField } from "@/components/ui/otp-field";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

const roleHome: Record<string, string> = {
  admin: "/admin",
  doctor: "/doctor/queue",
  receptionist: "/reception",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otpRequired, setOtpRequired] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", otpCode: "" },
  });

  async function onSubmit(data: LoginInput) {
    // Generic failure message is deliberate — never reveal whether the
    // identifier or the password was wrong (matches lib/auth.ts authorize).
    // Totp-enabled accounts reveal a second step only after the password
    // proves via a rate-limited pre-check (Auth.js v5 sanitizes errors
    // thrown from authorize, so no typed error can travel back).
    const submit = async (otpCode?: string) => {
      const result = await signIn("credentials", {
        identifier: data.identifier,
        password: data.password,
        otpCode,
        redirect: false,
      });
      if (!result || result.error) {
        toast.error("Invalid username or password.");
        return;
      }
      const session = await getSession();
      const role = session?.user?.role;
      const callbackUrl = searchParams.get("callbackUrl");
      const safeCallback =
        callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : null;
      router.push(safeCallback ?? (role ? roleHome[role] : "/"));
      router.refresh();
    };

    if (!otpRequired) {
      const check = await checkOtpRequired({
        identifier: data.identifier,
        password: data.password,
      });
      if (!check.ok) {
        toast.error(check.error);
        return;
      }
      if (check.otpRequired) {
        setOtpRequired(true);
        setValue("otpCode", "");
        toast.message("Enter the code emailed to you.");
        return;
      }
    }
    await submit(data.otpCode || undefined);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>OPD Clinic Login</CardTitle>
        <CardDescription>
          Sign in with your clinic account to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.identifier}>
              <FieldLabel htmlFor="identifier">Username or email</FieldLabel>
              <Input
                id="identifier"
                autoComplete="username"
                autoFocus
                placeholder=""
                aria-invalid={!!errors.identifier}
                {...register("identifier")}
              />
              <FieldError errors={[errors.identifier]} />
            </Field>
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <FieldError errors={[errors.password]} />
            </Field>
            {otpRequired && (
              <OtpField
                control={control}
                name="otpCode"
                label="Email code"
                autoFocus
              />
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              <Link href="/forgot-password" className="underline">
                Forgot password?
              </Link>
            </p>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
