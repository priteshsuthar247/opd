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
import { FormSelect } from "@/components/ui/form-select";
import { Textarea } from "@/components/ui/textarea";
import type { MedicineRow } from "@/db/queries/medicines";
import { medicineSchema, type MedicineFormValues } from "@/lib/validations/medicine";
import { medicineForms, statusOptions } from "@/lib/options";
import { createMedicine, updateMedicine } from "@/app/admin/medicines/actions";

export function MedicineDialog({ medicine }: { medicine?: MedicineRow }) {
  const [open, setOpen] = useState(false);
  const isEdit = !!medicine;
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MedicineFormValues>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: medicine?.name ?? "",
      genericName: medicine?.genericName ?? "",
      // DB may hold legacy free-text; only carry over listed values.
      form: (medicineForms as readonly string[]).includes(medicine?.form ?? "")
        ? (medicine?.form as (typeof medicineForms)[number])
        : undefined,
      defaultDosageNote: medicine?.defaultDosageNote ?? "",
      status: medicine?.status ?? "active",
    },
  });

  function medicineFormDefault(): (typeof medicineForms)[number] | undefined {
    const f = medicine?.form ?? "";
    return (medicineForms as readonly string[]).includes(f)
      ? (f as (typeof medicineForms)[number])
      : undefined;
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next)
      reset({
        name: medicine?.name ?? "",
        genericName: medicine?.genericName ?? "",
        form: medicineFormDefault(),
        defaultDosageNote: medicine?.defaultDosageNote ?? "",
        status: medicine?.status ?? "active",
      });
  }

  async function onSubmit(data: MedicineFormValues) {
    const result = isEdit
      ? await updateMedicine({ ...data, id: medicine.id })
      : await createMedicine(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Medicine updated." : "Medicine created.");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant={isEdit ? "outline" : "default"} size="sm">
            {isEdit ? "Edit" : "Add medicine"}
          </Button>
        }
      />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit medicine" : "Add medicine"}</DialogTitle>
          <DialogDescription>
            Medicines are picked when building prescriptions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="med-name">Name</FieldLabel>
              <Input
                id="med-name"
                placeholder="Paracetamol 500mg"
                autoFocus
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={!!errors.genericName}>
              <FieldLabel htmlFor="med-generic">Generic name</FieldLabel>
              <Input
                id="med-generic"
                placeholder="Paracetamol"
                aria-invalid={!!errors.genericName}
                {...register("genericName")}
              />
              <FieldError errors={[errors.genericName]} />
            </Field>
            <Field data-invalid={!!errors.form}>
              <FieldLabel>Form</FieldLabel>
              <Controller
                control={control}
                name="form"
                render={({ field }) => (
                  <FormSelect
                    value={field.value ?? ""}
                    onValueChange={(v) =>
                      field.onChange(
                        v === "" ? undefined : (v as (typeof medicineForms)[number])
                      )
                    }
                    options={medicineForms.map((f) => ({
                      value: f,
                      label: f,
                    }))}
                    placeholder="—"
                  />
                )}
              />
              <FieldError errors={[errors.form]} />
            </Field>
            <Field data-invalid={!!errors.defaultDosageNote}>
              <FieldLabel htmlFor="med-dosage">Default dosage note</FieldLabel>
              <Textarea
                id="med-dosage"
                placeholder="1 tablet twice daily after food"
                aria-invalid={!!errors.defaultDosageNote}
                {...register("defaultDosageNote")}
              />
              <FieldError errors={[errors.defaultDosageNote]} />
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
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
