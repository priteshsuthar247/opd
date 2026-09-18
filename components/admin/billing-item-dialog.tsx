"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/form-select";
import type { BillingItemRow } from "@/db/queries/billing-items";
import {
  billingItemSchema,
  type BillingItemFormValues,
} from "@/lib/validations/billing-item";
import {
  createBillingItem,
  updateBillingItem,
} from "@/app/admin/billing-items/actions";
import { billingItemTypes, statusOptions } from "@/lib/options";

function listedType(
  v: string | null | undefined
): (typeof billingItemTypes)[number] | undefined {
  const s = v ?? "";
  return (billingItemTypes as readonly string[]).includes(s)
    ? (s as (typeof billingItemTypes)[number])
    : undefined;
}

export function BillingItemDialog({ item }: { item?: BillingItemRow }) {
  const [open, setOpen] = useState(false);
  const isEdit = !!item;
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BillingItemFormValues>({
    resolver: zodResolver(billingItemSchema),
    defaultValues: {
      name: item?.name ?? "",
      type: listedType(item?.type),
      amount: item?.amount ?? "",
      status: item?.status ?? "active",
    },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next)
      reset({
        name: item?.name ?? "",
        type: listedType(item?.type),
        amount: item?.amount ?? "",
        status: item?.status ?? "active",
      });
  }

  async function onSubmit(data: BillingItemFormValues) {
    const result = isEdit
      ? await updateBillingItem({ ...data, id: item.id })
      : await createBillingItem(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Billing item updated." : "Billing item created.");
    setOpen(false);
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      triggerLabel={isEdit ? "Edit" : "Add billing item"}
      triggerVariant={isEdit ? "outline" : "default"}
      title={isEdit ? "Edit billing item" : "Add billing item"}
      description="Reusable fee line items added to invoices beyond the consultation fee."
      submitLabel={isEdit ? "Save changes" : "Create"}
      busy={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="bill-name">Name</FieldLabel>
              <Input
                id="bill-name"
                placeholder="Dressing"
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
                    value={field.value ?? ""}
                    onValueChange={(v) =>
                      field.onChange(
                        v === "" ? undefined : (v as (typeof billingItemTypes)[number])
                      )
                    }
                    options={billingItemTypes.map((t) => ({
                      value: t,
                      label: t,
                    }))}
                    placeholder="—"
                  />
                )}
              />
              <FieldError errors={[errors.type]} />
            </Field>
            <Field data-invalid={!!errors.amount}>
              <FieldLabel htmlFor="bill-amount">Amount (₹)</FieldLabel>
              <Input
                id="bill-amount"
                inputMode="decimal"
                placeholder="150.00"
                aria-invalid={!!errors.amount}
                {...register("amount")}
              />
              <FieldError errors={[errors.amount]} />
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
