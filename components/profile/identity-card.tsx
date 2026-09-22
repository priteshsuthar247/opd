"use client";

import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CircleCheckIcon, CircleXIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import {
  emailChangeConfirmSchema,
  emailChangeRequestSchema,
  profileNameSchema,
  profileUsernameSchema,
  type EmailChangeConfirmInput,
  type EmailChangeRequestInput,
  type ProfileNameInput,
  type ProfileUsernameInput,
} from "@/lib/validations/profile";
import {
  checkOwnUsername,
  confirmEmailChange,
  requestEmailChange,
  updateAvatarColor,
  updateProfileName,
  updateProfileUsername,
} from "@/app/profile/actions";

export const AVATAR_COLORS = [
  "#16a34a",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#ca8a04",
  "#0d9488",
  "#64748b",
] as const;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type Availability =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "free" }
  | { state: "taken"; suggestions: string[] }
  | { state: "invalid"; message: string };

export function IdentityCard({
  name,
  username,
  email,
  role,
  memberSince,
  lastLogin,
  avatarColor,
}: {
  name: string;
  username: string;
  email: string;
  role: string;
  memberSince: string;
  lastLogin: string;
  avatarColor: string | null;
}) {
  const [emailStep, setEmailStep] = useState<"idle" | "sent">("idle");

  const nameForm = useForm<ProfileNameInput>({
    resolver: zodResolver(profileNameSchema),
    defaultValues: { name },
  });
  const usernameForm = useForm<ProfileUsernameInput>({
    resolver: zodResolver(profileUsernameSchema),
    defaultValues: { username },
  });
  const emailForm = useForm<EmailChangeRequestInput>({
    resolver: zodResolver(emailChangeRequestSchema),
    defaultValues: { email: "" },
  });
  const otpForm = useForm<EmailChangeConfirmInput>({
    resolver: zodResolver(emailChangeConfirmSchema),
    defaultValues: { otp: "" },
  });
  const [availability, setAvailability] = useState<Availability>({
    state: "idle",
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function onName(data: ProfileNameInput) {
    const result = await updateProfileName(data);
    if (!result.ok) toast.error(result.error);
    else toast.success("Name updated.");
  }

  function handleUsernameChange(value: string) {
    if (timer.current) clearTimeout(timer.current);
    if (value.trim() === "" || value === username) {
      setAvailability({ state: "idle" });
      return;
    }
    setAvailability({ state: "checking" });
    timer.current = setTimeout(async () => {
      const result = await checkOwnUsername(value);
      if (!result.ok) {
        setAvailability({ state: "invalid", message: result.error });
        return;
      }
      setAvailability(
        result.available
          ? { state: "free" }
          : { state: "taken", suggestions: result.suggestions }
      );
    }, 500);
  }

  async function onUsername(data: ProfileUsernameInput) {
    const result = await updateProfileUsername(data);
    if (!result.ok) toast.error(result.error);
    else {
      toast.success("Username updated. Use it at the next sign-in.");
      setAvailability({ state: "idle" });
    }
  }

  async function onEmailRequest(data: EmailChangeRequestInput) {
    const result = await requestEmailChange(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setEmailStep("sent");
    toast.success("A verification code was sent to the new address.");
  }

  async function onEmailConfirm(data: EmailChangeConfirmInput) {
    const result = await confirmEmailChange(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Email changed. Sign in again with it.");
    setEmailStep("idle");
  }

  async function pickColor(color: string) {
    const result = await updateAvatarColor({ avatarColor: color });
    if (!result.ok) toast.error(result.error);
    else toast.success("Avatar color updated.");
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <Avatar
          className="size-10"
          style={avatarColor ? { backgroundColor: avatarColor } : undefined}
        >
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>{name}</CardTitle>
          <CardDescription>
            @{username} · {email}
          </CardDescription>
        </div>
        <Badge variant="secondary" className="ml-auto">
          {role}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-xs text-muted-foreground">
          Member since {memberSince} · Last sign-in {lastLogin}
        </p>
        <div className="flex flex-wrap gap-1.5" aria-label="Avatar color">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              aria-label={`Avatar color ${c}`}
              aria-pressed={avatarColor === c}
              onClick={() => void pickColor(c)}
              className="size-6 rounded-full border-2 border-transparent data-[active=true]:border-foreground"
              style={{ backgroundColor: c }}
              data-active={avatarColor === c}
            />
          ))}
        </div>
        <form onSubmit={nameForm.handleSubmit(onName)}>
          <FieldGroup>
            <Field data-invalid={!!nameForm.formState.errors.name}>
              <FieldLabel htmlFor="profile-name">Display name</FieldLabel>
              <Input
                id="profile-name"
                aria-invalid={!!nameForm.formState.errors.name}
                {...nameForm.register("name")}
              />
              <FieldError errors={[nameForm.formState.errors.name]} />
            </Field>
            <Button
              type="submit"
              disabled={nameForm.formState.isSubmitting}
              className="w-fit"
            >
              {nameForm.formState.isSubmitting ? "Saving…" : "Save name"}
            </Button>
          </FieldGroup>
        </form>
        <form onSubmit={usernameForm.handleSubmit(onUsername)}>
          <FieldGroup>
            <Field data-invalid={!!usernameForm.formState.errors.username}>
              <FieldLabel htmlFor="profile-username">Username</FieldLabel>
              <Controller
                control={usernameForm.control}
                name="username"
                render={({ field }) => (
                  <Input
                    id="profile-username"
                    autoComplete="off"
                    aria-invalid={
                      !!usernameForm.formState.errors.username
                    }
                    value={field.value ?? ""}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      handleUsernameChange(e.target.value);
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                )}
              />
              {availability.state === "checking" && (
                <p className="text-xs text-muted-foreground">Checking…</p>
              )}
              {availability.state === "free" && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CircleCheckIcon data-icon="inline-start" />
                  Available
                </p>
              )}
              {availability.state === "invalid" && (
                <p className="text-xs text-destructive">
                  {availability.message}
                </p>
              )}
              {availability.state === "taken" && (
                <div className="flex flex-col gap-1">
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <CircleXIcon data-icon="inline-start" />
                    Taken — try one of these:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {availability.suggestions.map((s) => (
                      <Button
                        key={s}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          usernameForm.setValue("username", s, {
                            shouldValidate: true,
                          });
                          setAvailability({ state: "free" });
                        }}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <FieldError errors={[usernameForm.formState.errors.username]} />
            </Field>
            <Button
              type="submit"
              disabled={usernameForm.formState.isSubmitting}
              className="w-fit"
            >
              {usernameForm.formState.isSubmitting
                ? "Saving…"
                : "Save username"}
            </Button>
          </FieldGroup>
        </form>
        {emailStep === "idle" ? (
          <form onSubmit={emailForm.handleSubmit(onEmailRequest)}>
            <FieldGroup>
              <Field data-invalid={!!emailForm.formState.errors.email}>
                <FieldLabel htmlFor="profile-email">
                  Change email (current: {email})
                </FieldLabel>
                <Input
                  id="profile-email"
                  type="email"
                  placeholder="new@opdclinic.com"
                  aria-invalid={!!emailForm.formState.errors.email}
                  {...emailForm.register("email")}
                />
                <FieldError errors={[emailForm.formState.errors.email]} />
              </Field>
              <Button
                type="submit"
                disabled={emailForm.formState.isSubmitting}
                className="w-fit"
              >
                {emailForm.formState.isSubmitting
                  ? "Sending…"
                  : "Send verification code"}
              </Button>
            </FieldGroup>
          </form>
        ) : (
          <form onSubmit={otpForm.handleSubmit(onEmailConfirm)}>
            <FieldGroup>
              <Field data-invalid={!!otpForm.formState.errors.otp}>
                <FieldLabel htmlFor="profile-email-otp">
                  Code sent to the new address
                </FieldLabel>
                <Input
                  id="profile-email-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  aria-invalid={!!otpForm.formState.errors.otp}
                  {...otpForm.register("otp")}
                />
                <FieldError errors={[otpForm.formState.errors.otp]} />
              </Field>
              <Button
                type="submit"
                disabled={otpForm.formState.isSubmitting}
                className="w-fit"
              >
                {otpForm.formState.isSubmitting
                  ? "Verifying…"
                  : "Confirm new email"}
              </Button>
            </FieldGroup>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
