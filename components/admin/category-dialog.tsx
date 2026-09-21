"use client";

import { useFormDialog } from "@/components/ui/form-dialog";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { StatusField, TextField } from "@/components/ui/form-fields";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormCombobox } from "@/components/ui/form-combobox";
import type { CategoryRow } from "@/db/queries/categories";
import { categorySchema, type CategoryInput } from "@/lib/validations/category";
import { createCategory, updateCategory } from "@/app/admin/categories/actions";

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
  const { controlled, openState, setOpenState } = useFormDialog({
    open,
    onOpenChange,
  });
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
            <TextField
              label="Name"
              id="cat-name"
              placeholder="Viral Fever"
              autoFocus
              error={errors.name}
              {...register("name")}
            />
            <Field data-invalid={!!errors.type}>
              <FieldLabel>Type</FieldLabel>
              <Controller
              control={control}
              name="type"
              render={({ field, fieldState }) => (
                <FormCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  label="Type"
                  invalid={!!errors.type}
                  options={(
                    Object.keys(typeLabels) as (keyof typeof typeLabels)[]
                  ).map((t) => ({ value: t, label: typeLabels[t] }))}
                />
              )}
              />
              <FieldError errors={[errors.type]} />
            </Field>
            <StatusField control={control} error={errors.status} />
          </FieldGroup>
    </FormDialog>
  );
}
