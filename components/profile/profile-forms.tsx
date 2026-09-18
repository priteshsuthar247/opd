"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
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
import { PasswordInput } from "@/components/ui/password-input";
import {
  passwordChangeSchema,
  profileNameSchema,
  type PasswordChangeInput,
  type ProfileNameInput,
} from "@/lib/validations/profile";
import { changePassword, updateProfileName } from "@/app/profile/actions";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileForms({
  name,
  email,
  role,
  memberSince,
}: {
  name: string;
  email: string;
  role: string;
  memberSince: string;
}) {
  const nameForm = useForm<ProfileNameInput>({
    resolver: zodResolver(profileNameSchema),
    defaultValues: { name },
  });
  const passForm = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onName(data: ProfileNameInput) {
    const result = await updateProfileName(data);
    if (!result.ok) toast.error(result.error);
    else toast.success("Name updated.");
  }

  async function onPassword(data: PasswordChangeInput) {
    const result = await changePassword(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Password changed. Please sign in again.");
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>
              {email} · Member since {memberSince}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="ml-auto">
            {role}
          </Badge>
        </CardHeader>
        <CardContent>
          <form onSubmit={nameForm.handleSubmit(onName)}>
            <FieldGroup>
              <Field
                data-invalid={!!nameForm.formState.errors.name}
              >
                <FieldLabel htmlFor="profile-name">Display name</FieldLabel>
                <Input
                  id="profile-name"
                  autoFocus
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
        </CardContent>
      </Card>

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
              <div className="grid grid-cols-2 gap-3">
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
    </div>
  );
}
