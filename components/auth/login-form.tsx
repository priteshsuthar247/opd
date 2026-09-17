"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSession, signIn } from "next-auth/react";
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
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

const roleHome: Record<string, string> = {
  admin: "/admin",
  doctor: "/doctor/queue",
  receptionist: "/reception",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginInput) {
    // Generic failure message is deliberate — never reveal whether the
    // email or the password was wrong (matches lib/auth.ts authorize).
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (!result || result.error) {
      toast.error("Invalid email or password.");
      return;
    }
    const session = await getSession();
    const role = session?.user?.role;
    const callbackUrl = searchParams.get("callbackUrl");
    const safeCallback =
      callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : null;
    router.push(safeCallback ?? (role ? roleHome[role] : "/"));
    router.refresh();
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
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@opdclinic.com"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <FieldError errors={[errors.password]} />
            </Field>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
