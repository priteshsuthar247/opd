"use client";

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
import {
  autoFeeSettingsSchema,
  noShowSettingsSchema,
  notificationSettingsSchema,
  type AutoFeeSettingsInput,
  type NoShowSettingsFormValues,
  type NotificationSettingsInput,
} from "@/lib/validations/settings";
import {
  updateAutoFeeSettings,
  updateNoShowSettings,
  updateNotificationSettings,
} from "@/app/admin/settings/actions";
import { Switch } from "@/components/ui/switch";
import { Controller } from "react-hook-form";

export function NoShowCard({
  minutes,
  gap,
}: {
  minutes: number;
  gap: number;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NoShowSettingsFormValues>({
    resolver: zodResolver(noShowSettingsSchema),
    defaultValues: { minutes, gap },
  });

  async function onSubmit(data: NoShowSettingsFormValues) {
    const result = await updateNoShowSettings(data);
    if (!result.ok) toast.error(result.error);
    else toast.success("No-show rules updated.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Queue &amp; No-show</CardTitle>
        <CardDescription>
          Waiting tokens are auto-flagged no-show when either rule trips.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!errors.minutes}>
                <FieldLabel htmlFor="ns-minutes">
                  Flag after (minutes)
                </FieldLabel>
                <Input
                  id="ns-minutes"
                  inputMode="numeric"
                  aria-invalid={!!errors.minutes}
                  {...register("minutes")}
                />
                <FieldError errors={[errors.minutes]} />
              </Field>
              <Field data-invalid={!!errors.gap}>
                <FieldLabel htmlFor="ns-gap">Token gap</FieldLabel>
                <Input
                  id="ns-gap"
                  inputMode="numeric"
                  aria-invalid={!!errors.gap}
                  {...register("gap")}
                />
                <FieldError errors={[errors.gap]} />
              </Field>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-fit">
              {isSubmitting ? "Saving…" : "Save rules"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

export function AutoFeeCard({ enabled }: { enabled: boolean }) {
  const { control, handleSubmit, formState: { isSubmitting } } =
    useForm<AutoFeeSettingsInput>({
      resolver: zodResolver(autoFeeSettingsSchema),
      defaultValues: { enabled },
    });

  async function onSubmit(data: AutoFeeSettingsInput) {
    const result = await updateAutoFeeSettings(data);
    if (!result.ok) toast.error(result.error);
    else toast.success("Billing rule updated.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>
          New invoices auto-fill the consultation fee from the doctor&apos;s
          profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex items-center justify-between gap-4"
        >
          <span className="text-sm font-medium">Auto consultation fee</span>
          <span className="flex items-center gap-3">
            <Controller
              control={control}
              name="enabled"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Auto consultation fee"
                />
              )}
            />
            <Button type="submit" disabled={isSubmitting} size="sm">
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </span>
        </form>
      </CardContent>
    </Card>
  );
}

const notificationFields = [
  {
    key: "appointment_booked",
    label: "Appointment booked",
    hint: "Confirmation when a token is assigned.",
  },
  {
    key: "turn_approaching",
    label: "Turn approaching",
    hint: "Nudge for the token on deck after Call Next.",
  },
  {
    key: "prescription_finalized",
    label: "Prescription finalized",
    hint: "Notice when the doctor locks a prescription.",
  },
  {
    key: "follow_up_due",
    label: "Follow-up due",
    hint: "Flag set alongside a dated follow-up.",
  },
] as const;

export function NotificationsCard({
  initial,
}: {
  initial: NotificationSettingsInput;
}) {
  const { control, handleSubmit, formState: { isSubmitting } } =
    useForm<NotificationSettingsInput>({
      resolver: zodResolver(notificationSettingsSchema),
      defaultValues: initial,
    });

  async function onSubmit(data: NotificationSettingsInput) {
    const result = await updateNotificationSettings(data);
    if (!result.ok) toast.error(result.error);
    else toast.success("Notification switches updated.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Which events write to the in-app feed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            {notificationFields.map((f) => (
              <div
                key={f.key}
                className="flex items-center justify-between gap-4"
              >
                <span>
                  <span className="block text-sm font-medium">
                    {f.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {f.hint}
                  </span>
                </span>
                <Controller
                  control={control}
                  name={f.key}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label={f.label}
                    />
                  )}
                />
              </div>
            ))}
            <Button type="submit" disabled={isSubmitting} className="w-fit">
              {isSubmitting ? "Saving…" : "Save switches"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
