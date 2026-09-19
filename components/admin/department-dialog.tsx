"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/form-select";
import type { DepartmentRow } from "@/db/queries/departments";
import {
  departmentSchema,
  type DepartmentInput,
} from "@/lib/validations/department";
import { createDepartment, updateDepartment } from "@/app/admin/departments/actions";
import { statusOptions } from "@/lib/options";

export function DepartmentDialog({
  department,
  open,
  onOpenChange,
}: {
  department?: DepartmentRow;
  // Controlled mode for table row menus (no trigger button). Uncontrolled
  // mode (with trigger) is the default for page-level Add buttons.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = open !== undefined;
  const openState = open ?? internalOpen;
  const setOpenState = onOpenChange ?? setInternalOpen;
  const isEdit = !!department;
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentInput>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: department?.name ?? "",
      code: department?.code ?? "",
      status: department?.status ?? "active",
    },
  });

  async function onSubmit(data: DepartmentInput) {
    const result = isEdit
      ? await updateDepartment({ ...data, id: department.id })
      : await createDepartment(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Department updated." : "Department created.");
    setOpenState(false);
    reset(data);
  }

  function handleOpenChange(next: boolean) {
    setOpenState(next);
    // Refresh defaults on every open so a previous submit (or a changed
    // row) never leaks stale values into the next session.
    if (next)
      reset({
        name: department?.name ?? "",
        code: department?.code ?? "",
        status: department?.status ?? "active",
      });
  }

  return (
    <FormDialog
      open={openState}
      onOpenChange={handleOpenChange}
      triggerLabel={controlled ? undefined : isEdit ? "Edit" : "Add department"}
      triggerVariant={isEdit ? "outline" : "default"}
      title={isEdit ? "Edit department" : "Add department"}
      description="Departments group doctors by specialty."
      submitLabel={isEdit ? "Save changes" : "Create"}
      busy={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="dept-name">Name</FieldLabel>
          <Input
            id="dept-name"
            placeholder="General Medicine"
            autoFocus
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field data-invalid={!!errors.code}>
          <FieldLabel htmlFor="dept-code">Code</FieldLabel>
          <Input
            id="dept-code"
            placeholder="GEN"
            aria-invalid={!!errors.code}
            {...register("code")}
          />
          <FieldError errors={[errors.code]} />
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
