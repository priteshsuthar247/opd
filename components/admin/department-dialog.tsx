"use client";

import { useFormDialog } from "@/components/ui/form-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FieldGroup } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { StatusField, TextField } from "@/components/ui/form-fields";
import type { DepartmentRow } from "@/db/queries/departments";
import {
  departmentSchema,
  type DepartmentInput,
} from "@/lib/validations/department";
import { createDepartment, updateDepartment } from "@/app/admin/departments/actions";

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
  const { controlled, openState, setOpenState } = useFormDialog({
    open,
    onOpenChange,
  });
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
        <TextField
          label="Name"
          id="dept-name"
          placeholder="General Medicine"
          autoFocus
          error={errors.name}
          {...register("name")}
        />
        <TextField
          label="Code"
          id="dept-code"
          placeholder="GEN"
          error={errors.code}
          {...register("code")}
        />
        <StatusField control={control} error={errors.status} />
      </FieldGroup>
    </FormDialog>
  );
}
