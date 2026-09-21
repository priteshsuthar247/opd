"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PrescriptionBadge } from "@/components/billing/status-badges";
import { ConfirmButton } from "@/components/ui/confirm-button";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ConsultationBundle } from "@/db/queries/clinical";
import {
  prescriptionItemSchema,
  type PrescriptionItemFormValues,
} from "@/lib/validations/prescription";
import {
  addPrescriptionItem,
  finalizePrescription,
  removePrescriptionItem,
} from "@/app/doctor/(shell)/consultation/actions";

const FREE_TEXT = "__free_text__";

type Consultation = NonNullable<ConsultationBundle>["consultation"];

export function PrescriptionBuilder({
  consultation,
  medicines,
}: {
  consultation: Consultation;
  medicines: { id: number; name: string; defaultDosageNote: string | null }[];
}) {
  const router = useRouter();
  const [freeText, setFreeText] = useState(false);
  const consultationId = consultation?.id ?? 0;
  const prescription = consultation?.prescription;
  const finalized = prescription?.status === "finalized";
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PrescriptionItemFormValues>({
    resolver: zodResolver(prescriptionItemSchema),
    defaultValues: {
      consultationId: consultation?.id ?? 0,
      medicineId: undefined,
      freeTextName: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    },
  });

  if (!consultation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prescription</CardTitle>
          <CardDescription>
            Save the consultation first to open a prescription draft.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const items = prescription?.items ?? [];

  async function onAdd(data: PrescriptionItemFormValues) {
    const result = await addPrescriptionItem(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Medicine added.");
    reset({
      consultationId,
      medicineId: undefined,
      freeTextName: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    });
    setFreeText(false);
    router.refresh();
  }

  async function onRemove(id: number) {
    const result = await removePrescriptionItem({ id });
    if (!result.ok) toast.error(result.error);
    else {
      toast.success("Medicine removed.");
      router.refresh();
    }
  }

  async function onFinalize() {
    const result = await finalizePrescription({ consultationId });
    if (!result.ok) toast.error(result.error);
    else {
      toast.success("Prescription finalized — items are now read-only.");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Prescription</CardTitle>
            <CardDescription>
              {prescription ? (
                <PrescriptionBadge status={prescription.status} />
              ) : (
                "Save the consultation first to open a draft."
              )}
            </CardDescription>
          </div>
          {prescription && !finalized && items.length > 0 && (
            <Button variant="outline" size="sm" onClick={onFinalize}>
              Finalize
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {items.length > 0 && (
          <ul className="flex flex-col gap-2">
            {items.map((i) => (
              <li
                key={i.id}
                className="flex items-start justify-between gap-2 border p-2 text-xs"
              >
                <div>
                  <p className="font-medium">
                    {i.medicine?.name ?? i.freeTextName ?? "—"}
                  </p>
                  <p className="text-muted-foreground">
                    {i.dosage} · {i.frequency} · {i.duration}
                    {i.instructions ? ` · ${i.instructions}` : ""}
                  </p>
                </div>
                {!finalized && (
                  <ConfirmButton
                    label="Remove"
                    title="Remove this medicine?"
                    description={`${i.medicine?.name ?? i.freeTextName ?? "This line"} will be dropped from the draft prescription.`}
                    confirmLabel="Remove"
                    onConfirm={() => onRemove(i.id)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
        {prescription && !finalized && (
          <form onSubmit={handleSubmit(onAdd)}>
            <FieldGroup>
              <Field>
                <FieldLabel>Medicine</FieldLabel>
                <Controller
                  control={control}
                  name="medicineId"
                  render={({ field }) => (
                    <Select
                      value={
                        freeText
                          ? FREE_TEXT
                          : field.value
                            ? String(field.value)
                            : ""
                      }
                      onValueChange={(v) => {
                        if (v === FREE_TEXT) {
                          setFreeText(true);
                          field.onChange(undefined);
                        } else {
                          setFreeText(false);
                          field.onChange(Number(v));
                        }
                      }}
                      items={{
                        ...Object.fromEntries(
                          medicines.map((m) => [String(m.id), m.name])
                        ),
                        [FREE_TEXT]: "Other (type name)…",
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pick…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Medicines</SelectLabel>
                          {medicines.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectItem value={FREE_TEXT}>
                          Other (type name)…
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              {freeText && (
                <Field data-invalid={!!errors.freeTextName}>
                  <FieldLabel htmlFor="rx-freetext">Medicine name</FieldLabel>
                  <Input
                    id="rx-freetext"
                    placeholder="Type medicine name"
                    {...register("freeTextName")}
                  />
                  <FieldError errors={[errors.freeTextName]} />
                </Field>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field data-invalid={!!errors.dosage}>
                  <FieldLabel htmlFor="rx-dosage">Dosage</FieldLabel>
                  <Input
                    id="rx-dosage"
                    placeholder="500mg"
                    {...register("dosage")}
                  />
                  <FieldError errors={[errors.dosage]} />
                </Field>
                <Field data-invalid={!!errors.frequency}>
                  <FieldLabel htmlFor="rx-freq">Frequency</FieldLabel>
                  <Input
                    id="rx-freq"
                    placeholder="1-0-1"
                    {...register("frequency")}
                  />
                  <FieldError errors={[errors.frequency]} />
                </Field>
                <Field data-invalid={!!errors.duration}>
                  <FieldLabel htmlFor="rx-dur">Duration</FieldLabel>
                  <Input
                    id="rx-dur"
                    placeholder="5 days"
                    {...register("duration")}
                  />
                  <FieldError errors={[errors.duration]} />
                </Field>
              </div>
              <Field data-invalid={!!errors.instructions}>
                <FieldLabel htmlFor="rx-inst">Instructions</FieldLabel>
                <Textarea
                  id="rx-inst"
                  rows={1}
                  placeholder="After food"
                  {...register("instructions")}
                />
                <FieldError errors={[errors.instructions]} />
              </Field>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding…" : "Add medicine"}
              </Button>
            </FieldGroup>
          </form>
        )}
        {finalized && (
          <p className="text-xs text-muted-foreground">
            Finalized — items are read-only. Corrections need a new
            prescription.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
