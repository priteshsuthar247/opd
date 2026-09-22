"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ConsultationBundle } from "@/db/queries/clinical";
import {
  consultationSchema,
  type ConsultationFormValues,
} from "@/lib/validations/consultation";
import { saveConsultation } from "@/app/doctor/(shell)/consultation/actions";

type Vitals = {
  bp?: string;
  tempC?: number | string;
  pulse?: number | string;
  weightKg?: number | string;
};

const str = (v: unknown): string =>
  v === null || v === undefined ? "" : String(v);

export function ConsultationForm({
  bundle,
}: {
  bundle: NonNullable<ConsultationBundle>;
}) {
  const c = bundle.consultation;
  const vitals = (c?.vitals ?? {}) as Vitals;
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      appointmentId: bundle.id,
      vitals: {
        bp: typeof vitals.bp === "string" ? vitals.bp : "",
        tempC: str(vitals.tempC),
        pulse: str(vitals.pulse),
        weightKg: str(vitals.weightKg),
      },
      chiefComplaint: c?.chiefComplaint ?? "",
      diagnosis: c?.diagnosis ?? "",
      notes: c?.notes ?? "",
      followUpRequired: c?.followUpRequired ?? false,
      followUpDate: c?.followUpDate ?? "",
    },
  });
  const followUpRequired = watch("followUpRequired");
  const router = useRouter();

  // Browser-native unsaved-changes guard: doctors navigate mid-entry
  // (queue board, interruptions). Zero UI, just works.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  async function onSubmit(data: ConsultationFormValues) {
    const result = await saveConsultation(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Consultation saved.");
    // Reload the draft prescription + saved values without a full reload.
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultation</CardTitle>
        <CardDescription>
          Vitals, complaint, diagnosis and notes for this visit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel>Vitals</FieldLabel>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <Field data-invalid={!!errors.vitals?.bp}>
                  <FieldLabel htmlFor="vit-bp">BP</FieldLabel>
                  <Input
                    id="vit-bp"
                    placeholder="120/80"
                    {...register("vitals.bp")}
                  />
                </Field>
                <Field data-invalid={!!errors.vitals?.tempC}>
                  <FieldLabel htmlFor="vit-temp">Temp (°C)</FieldLabel>
                  <Input
                    id="vit-temp"
                    inputMode="decimal"
                    placeholder="37.0"
                    {...register("vitals.tempC")}
                  />
                </Field>
                <Field data-invalid={!!errors.vitals?.pulse}>
                  <FieldLabel htmlFor="vit-pulse">Pulse</FieldLabel>
                  <Input
                    id="vit-pulse"
                    inputMode="numeric"
                    placeholder="72"
                    {...register("vitals.pulse")}
                  />
                </Field>
                <Field data-invalid={!!errors.vitals?.weightKg}>
                  <FieldLabel htmlFor="vit-wt">Weight (kg)</FieldLabel>
                  <Input
                    id="vit-wt"
                    inputMode="decimal"
                    placeholder="68"
                    {...register("vitals.weightKg")}
                  />
                </Field>
              </div>
            </Field>
            <Field data-invalid={!!errors.chiefComplaint}>
              <FieldLabel htmlFor="con-complaint">Chief complaint</FieldLabel>
              <Textarea
                id="con-complaint"
                rows={2}
                {...register("chiefComplaint")}
              />
              <FieldError errors={[errors.chiefComplaint]} />
            </Field>
            <Field data-invalid={!!errors.diagnosis}>
              <FieldLabel htmlFor="con-diagnosis">Diagnosis</FieldLabel>
              <Textarea
                id="con-diagnosis"
                rows={2}
                {...register("diagnosis")}
              />
              <FieldError errors={[errors.diagnosis]} />
            </Field>
            <Field data-invalid={!!errors.notes}>
              <FieldLabel htmlFor="con-notes">Clinical notes</FieldLabel>
              <Textarea id="con-notes" rows={3} {...register("notes")} />
              <FieldError errors={[errors.notes]} />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field>
                <Controller
                  control={control}
                  name="followUpRequired"
                  render={({ field }) => (
                    <label className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                      Follow-up required
                    </label>
                  )}
                />
              </Field>
              {followUpRequired && (
                <Field data-invalid={!!errors.followUpDate}>
                  <FieldLabel htmlFor="con-followup">Follow-up date</FieldLabel>
                  <Input
                    id="con-followup"
                    type="date"
                    {...register("followUpDate")}
                  />
                  <FieldError errors={[errors.followUpDate]} />
                </Field>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : c ? "Save changes" : "Save consultation"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
