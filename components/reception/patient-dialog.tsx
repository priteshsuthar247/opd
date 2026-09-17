"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PatientRow } from "@/db/queries/patients";
import { patientSchema, type PatientFormValues } from "@/lib/validations/patient";
import { createPatient, updatePatient } from "@/app/reception/patients/actions";

function defaults(patient?: PatientRow): PatientFormValues {
  return {
    name: patient?.name ?? "",
    phone: patient?.phone ?? "",
    dob: patient?.dob ?? "",
    gender: patient?.gender ?? undefined,
    bloodGroup: patient?.bloodGroup ?? "",
    address: patient?.address ?? "",
    emergencyContact: patient?.emergencyContact ?? "",
    status: patient?.status ?? "active",
  };
}

export function PatientDialog({ patient }: { patient?: PatientRow }) {
  const [open, setOpen] = useState(false);
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
    setOpen(next);
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
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant={isEdit ? "outline" : "default"} size="sm">
            {isEdit ? "Edit" : "Register patient"}
          </Button>
        }
      />
      <DialogContent className="max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit patient" : "Register patient"}
          </DialogTitle>
          <DialogDescription>
            Phone numbers are unique — search before registering.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="pat-name">Name</FieldLabel>
                <Input
                  id="pat-name"
                  placeholder="Ramesh Patel"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                <FieldError errors={[errors.name]} />
              </Field>
              <Field data-invalid={!!errors.phone}>
                <FieldLabel htmlFor="pat-phone">Phone</FieldLabel>
                <Input
                  id="pat-phone"
                  inputMode="tel"
                  placeholder="9800000001"
                  aria-invalid={!!errors.phone}
                  {...register("phone")}
                />
                <FieldError errors={[errors.phone]} />
              </Field>
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
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(v) =>
                        field.onChange(
                          v === "" ? undefined : (v as "male" | "female" | "other")
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.gender]} />
              </Field>
              <Field data-invalid={!!errors.bloodGroup}>
                <FieldLabel htmlFor="pat-bg">Blood grp</FieldLabel>
                <Input
                  id="pat-bg"
                  placeholder="O+"
                  aria-invalid={!!errors.bloodGroup}
                  {...register("bloodGroup")}
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
              <Field data-invalid={!!errors.status}>
                <FieldLabel>Status</FieldLabel>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.status]} />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Register"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
