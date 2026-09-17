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
import type { DepartmentRow } from "@/db/queries/departments";
import {
  departmentSchema,
  type DepartmentInput,
} from "@/lib/validations/department";
import { createDepartment, updateDepartment } from "@/app/admin/departments/actions";

export function DepartmentDialog({
  department,
}: {
  department?: DepartmentRow;
}) {
  const [open, setOpen] = useState(false);
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
    setOpen(false);
    reset(data);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant={isEdit ? "outline" : "default"} size="sm">
            {isEdit ? "Edit" : "Add department"}
          </Button>
        }
      />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit department" : "Add department"}
          </DialogTitle>
          <DialogDescription>
            Departments group doctors by specialty.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="dept-name">Name</FieldLabel>
              <Input
                id="dept-name"
                placeholder="General Medicine"
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
