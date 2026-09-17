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
import type { CategoryRow } from "@/db/queries/categories";
import { categorySchema, type CategoryInput } from "@/lib/validations/category";
import { createCategory, updateCategory } from "@/app/admin/categories/actions";

const typeLabels: Record<CategoryInput["type"], string> = {
  diagnosis: "Diagnosis",
  symptom: "Symptom",
  complaint: "Complaint",
};

export function CategoryDialog({ category }: { category?: CategoryRow }) {
  const [open, setOpen] = useState(false);
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
    setOpen(next);
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
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant={isEdit ? "outline" : "default"} size="sm">
            {isEdit ? "Edit" : "Add category"}
          </Button>
        }
      />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "Add category"}</DialogTitle>
          <DialogDescription>
            Shared diagnosis, symptom and complaint values for clinical and
            reporting use.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(typeLabels) as (keyof typeof typeLabels)[]).map(
                        (t) => (
                          <SelectItem key={t} value={t}>
                            {typeLabels[t]}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
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
