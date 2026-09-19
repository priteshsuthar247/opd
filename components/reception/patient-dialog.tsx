"use client";

import { useFormDialog } from "@/components/ui/form-dialog";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { StatusField, TextField } from "@/components/ui/form-fields";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/form-select";
import { Textarea } from "@/components/ui/textarea";
import type { PatientRow } from "@/db/queries/patients";
import { patientSchema, type PatientFormValues } from "@/lib/validations/patient";
import { createPatient, updatePatient } from "@/app/reception/patients/actions";
import { bloodGroups } from "@/lib/options";

function defaults(patient?: PatientRow): PatientFormValues {
  // DB stores free-text history; only carry over values in the enum.
  const bg = patient?.bloodGroup ?? "";
  return {
    name: patient?.name ?? "",
    phone: patient?.phone ?? "",
    dob: patient?.dob ?? "",
    gender: patient?.gender ?? undefined,
    bloodGroup: (bloodGroups as readonly string[]).includes(bg)
      ? (bg as (typeof bloodGroups)[number])
      : undefined,
    address: patient?.address ?? "",
    emergencyContact: patient?.emergencyContact ?? "",
    status: patient?.status ?? "active",
  };
}

export function PatientDialog({
  patient,
  open,
  onOpenChange,
}: {
  patient?: PatientRow;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { controlled, openState, setOpenState } = useFormDialog({
    open,
    onOpenChange,
  });
  const isEdit = !!patient;
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: defaults(patient),
  });

  function handleOpenChange(next: boolean) {
    setOpenState(next);
    if (next) reset(defaults(patient));
  }

  async function onSubmit(data: PatientFormValues) {
    const result = isEdit
      ? await updatePatient({ ...data, id: patient.id })
      : await createPatient(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Patient updated." : "Patient registered.");
    setOpenState(false);
  }

  return (
    <FormDialog
      open={openState}
      onOpenChange={handleOpenChange}
      triggerLabel={controlled ? undefined : isEdit ? "Edit" : "Register patient"}
      triggerVariant={isEdit ? "outline" : "default"}
      title={isEdit ? "Edit patient" : "Register patient"}
      description="Phone numbers are unique — search before registering."
      size="lg"
      submitLabel={isEdit ? "Save changes" : "Register"}
      busy={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Name"
                id="pat-name"
                placeholder="Ramesh Patel"
                autoFocus
                error={errors.name}
                {...register("name")}
              />
              <TextField
                label="Phone"
                id="pat-phone"
                inputMode="tel"
                placeholder="9800000001"
                error={errors.phone}
                {...register("phone")}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field data-invalid={!!errors.dob}>
                <FieldLabel htmlFor="pat-dob">Birth date</FieldLabel>
                <Input
                  id="pat-dob"
                  type="date"
                  aria-invalid={!!errors.dob}
                  {...register("dob")}
                />
                <FieldError errors={[errors.dob]} />
              </Field>
              <Field data-invalid={!!errors.gender}>
                <FieldLabel>Gender</FieldLabel>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <FormSelect
                      value={field.value ?? ""}
                      onValueChange={(v) =>
                        field.onChange(
                          v === "" ? undefined : (v as "male" | "female" | "other")
                        )
                      }
                      options={[
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                        { value: "other", label: "Other" },
                      ]}
                      placeholder="—"
                    />
                  )}
                />
                <FieldError errors={[errors.gender]} />
              </Field>
              <Field data-invalid={!!errors.bloodGroup}>
                <FieldLabel>Blood group</FieldLabel>
                <Controller
                  control={control}
                  name="bloodGroup"
                  render={({ field }) => (
                    <FormSelect
                      value={field.value ?? ""}
                      onValueChange={(v) =>
                        field.onChange(
                          v === "" ? undefined : (v as (typeof bloodGroups)[number])
                        )
                      }
                      options={bloodGroups.map((b) => ({
                        value: b,
                        label: b,
                      }))}
                      placeholder="—"
                    />
                  )}
                />
                <FieldError errors={[errors.bloodGroup]} />
              </Field>
            </div>
            <Field data-invalid={!!errors.address}>
              <FieldLabel htmlFor="pat-addr">Address</FieldLabel>
              <Textarea
                id="pat-addr"
                rows={2}
                aria-invalid={!!errors.address}
                {...register("address")}
              />
              <FieldError errors={[errors.address]} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!errors.emergencyContact}>
                <FieldLabel htmlFor="pat-emg">Emergency contact</FieldLabel>
                <Input
                  id="pat-emg"
                  inputMode="tel"
                  aria-invalid={!!errors.emergencyContact}
                  {...register("emergencyContact")}
                />
                <FieldError errors={[errors.emergencyContact]} />
              </Field>
              <StatusField control={control} error={errors.status} />
            </div>
          </FieldGroup>
    </FormDialog>
  );
}
