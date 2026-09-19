"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/form-select";
import type { CategoryRow } from "@/db/queries/categories";
import { categorySchema, type CategoryInput } from "@/lib/validations/category";
import { createCategory, updateCategory } from "@/app/admin/categories/actions";
import { statusOptions } from "@/lib/options";

const typeLabels: Record<CategoryInput["type"], string> = {
  diagnosis: "Diagnosis",
  symptom: "Symptom",
  complaint: "Complaint",
};

export function CategoryDialog({
  category,
  open,
  onOpenChange,
}: {
  category?: CategoryRow;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = open !== undefined;
  const openState = open ?? internalOpen;
  const setOpenState = onOpenChange ?? setInternalOpen;
  const isEdit = !!category;
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      type: category?.type ?? "symptom",
      status: category?.status ?? "active",
    },
  });

  function handleOpenChange(next: boolean) {
    setOpenState(next);
    if (next)
      reset({
        name: category?.name ?? "",
        type: category?.type ?? "symptom",
        status: category?.status ?? "active",
      });
  }

  async function onSubmit(data: CategoryInput) {
    const result = isEdit
      ? await updateCategory({ ...data, id: category.id })
      : await createCategory(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Category updated." : "Category created.");
    setOpenState(false);
  }

  return (
    <FormDialog
      open={openState}
      onOpenChange={handleOpenChange}
      triggerLabel={controlled ? undefined : isEdit ? "Edit" : "Add category"}
      triggerVariant={isEdit ? "outline" : "default"}
      title={isEdit ? "Edit category" : "Add category"}
      description="Shared diagnosis, symptom and complaint values for clinical and reporting use."
      submitLabel={isEdit ? "Save changes" : "Create"}
      busy={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="cat-name">Name</FieldLabel>
              <Input
                id="cat-name"
                placeholder="Viral Fever"
                autoFocus
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={!!errors.type}>
              <FieldLabel>Type</FieldLabel>
              <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <FormSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  options={(
                    Object.keys(typeLabels) as (keyof typeof typeLabels)[]
                  ).map((t) => ({ value: t, label: typeLabels[t] }))}
                />
              )}
              />
              <FieldError errors={[errors.type]} />
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
