"use client";

import { useFormDialog } from "@/components/ui/form-dialog";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import type { DoctorRow } from "@/db/queries/doctors";
import {
  doctorEditSchema,
  doctorSchema,
  type DoctorFormValues,
} from "@/lib/validations/doctor";
import { statusOptions } from "@/lib/options";
import { createDoctor, updateDoctor } from "@/app/admin/doctors/actions";

const days = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
] as const;

type DayKey = (typeof days)[number]["key"];

function dayDefault(
  workingHours: DoctorRow["workingHours"],
  day: DayKey
): { start: string; end: string } {
  const record =
    typeof workingHours === "object" && workingHours !== null
      ? (workingHours as Record<string, { start?: string; end?: string }>)
      : null;
  const d = record?.[day];
  return { start: d?.start ?? "", end: d?.end ?? "" };
}

function hoursDefaults(
  workingHours?: DoctorRow["workingHours"]
): DoctorFormValues["workingHours"] {
  return {
    mon: dayDefault(workingHours, "mon"),
    tue: dayDefault(workingHours, "tue"),
    wed: dayDefault(workingHours, "wed"),
    thu: dayDefault(workingHours, "thu"),
    fri: dayDefault(workingHours, "fri"),
    sat: dayDefault(workingHours, "sat"),
    sun: dayDefault(workingHours, "sun"),
  };
}

export function DoctorDialog({
  doctor,
  departments,
  open,
  onOpenChange,
}: {
  doctor?: DoctorRow;
  departments: { id: number; name: string }[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { controlled, openState, setOpenState } = useFormDialog({
    open,
    onOpenChange,
  });
  const isEdit = !!doctor;
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DoctorFormValues>({
    // Mode-correct schema at runtime. The cast bridges RHF's invariant
    // Resolver against Zod's input/output split; both schemas validate the
    // same form shape, differing only in password requiredness.
    resolver: zodResolver(isEdit ? doctorEditSchema : doctorSchema) as Resolver<
      DoctorFormValues
    >,
    defaultValues: {
      name: doctor?.user.name ?? "",
      email: doctor?.user.email ?? "",
      password: "",
      // 0 = unpicked; positive() rejects it with "Pick a department".
      departmentId: doctor?.departmentId ?? 0,
      qualification: doctor?.qualification ?? "",
      registrationNo: doctor?.registrationNo ?? "",
      consultationFee: doctor?.consultationFee ?? "",
      workingHours: hoursDefaults(doctor?.workingHours),
      status: doctor?.status ?? "active",
    },
  });

  function handleOpenChange(next: boolean) {
    setOpenState(next);
    if (next)
      reset({
        name: doctor?.user.name ?? "",
        email: doctor?.user.email ?? "",
        password: "",
        departmentId: doctor?.departmentId ?? 0,
        qualification: doctor?.qualification ?? "",
        registrationNo: doctor?.registrationNo ?? "",
        consultationFee: doctor?.consultationFee ?? "",
        workingHours: hoursDefaults(doctor?.workingHours),
        status: doctor?.status ?? "active",
      });
  }

  async function onSubmit(data: DoctorFormValues) {
    const result = isEdit
      ? await updateDoctor({ ...data, id: doctor.id })
      : await createDoctor(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Doctor updated." : "Doctor created.");
    setOpenState(false);
  }

  return (
    <FormDialog
      open={openState}
      onOpenChange={handleOpenChange}
      triggerLabel={controlled ? undefined : isEdit ? "Edit" : "Add doctor"}
      triggerVariant={isEdit ? "outline" : "default"}
      title={isEdit ? "Edit doctor" : "Add doctor"}
      description="Login account, clinical profile and queue rules are created together."
      size="lg"
      submitLabel={isEdit ? "Save changes" : "Create"}
      busy={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="doc-name">Name</FieldLabel>
              <Input
                id="doc-name"
                placeholder="Dr. Aisha Verma"
                autoFocus
                aria-invalid={!!errors.name}
                  {...register("name")}
                />
                <FieldError errors={[errors.name]} />
              </Field>
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="doc-email">Email</FieldLabel>
                <Input
                  id="doc-email"
                  type="email"
                  placeholder="aisha@opdclinic.com"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                <FieldError errors={[errors.email]} />
              </Field>
            </div>
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="doc-password">
                {isEdit ? "New password (leave blank to keep)" : "Password"}
              </FieldLabel>
              <PasswordInput
                id="doc-password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <FieldError errors={[errors.password]} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!errors.departmentId}>
                <FieldLabel>Department</FieldLabel>
                <Controller
                  control={control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormSelect
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                      options={departments.map((d) => ({
                        value: String(d.id),
                        label: d.name,
                      }))}
                      placeholder="Pick…"
                    />
                  )}
                />
                <FieldError errors={[errors.departmentId]} />
              </Field>
              <Field data-invalid={!!errors.consultationFee}>
                <FieldLabel htmlFor="doc-fee">Fee (₹)</FieldLabel>
                <Input
                  id="doc-fee"
                  inputMode="decimal"
                  placeholder="500.00"
                  aria-invalid={!!errors.consultationFee}
                  {...register("consultationFee")}
                />
                <FieldError errors={[errors.consultationFee]} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!errors.qualification}>
                <FieldLabel htmlFor="doc-qual">Qualification</FieldLabel>
                <Input
                  id="doc-qual"
                  placeholder="MBBS, MD"
                  aria-invalid={!!errors.qualification}
                  {...register("qualification")}
                />
                <FieldError errors={[errors.qualification]} />
              </Field>
              <Field data-invalid={!!errors.registrationNo}>
                <FieldLabel htmlFor="doc-reg">Registration no.</FieldLabel>
                <Input
                  id="doc-reg"
                  placeholder="MCI-10234"
                  aria-invalid={!!errors.registrationNo}
                  {...register("registrationNo")}
                />
                <FieldError errors={[errors.registrationNo]} />
              </Field>
            </div>
            <Field>
              <FieldLabel>Working hours (blank day = off)</FieldLabel>
              <div className="flex flex-col gap-1.5">
                {days.map((d) => {
                  const msg =
                    errors.workingHours?.[d.key]?.message?.toString();
                  return (
                    <div key={d.key}>
                      <div className="grid grid-cols-[3rem_1fr_1fr] items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {d.label}
                        </span>
                        <Input
                          type="time"
                          aria-label={`${d.label} start`}
                          {...register(`workingHours.${d.key}.start`)}
                        />
                        <Input
                          type="time"
                          aria-label={`${d.label} end`}
                          {...register(`workingHours.${d.key}.end`)}
                        />
                      </div>
                      {msg && (
                        <p className="text-xs font-normal text-destructive">
                          {msg}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Field>
            <Field data-invalid={!!errors.status}>
              <FieldLabel>Status</FieldLabel>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <FormSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    options={[...statusOptions]}
                  />
                )}
              />
              <FieldError errors={[errors.status]} />
            </Field>
          </FieldGroup>
    </FormDialog>
  );
}
