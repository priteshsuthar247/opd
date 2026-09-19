"use client";

import { useFormDialog } from "@/components/ui/form-dialog";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { StatusField, TextField } from "@/components/ui/form-fields";
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
import { billingItemTypes } from "@/lib/options";

function listedType(
  v: string | null | undefined
): (typeof billingItemTypes)[number] | undefined {
  const s = v ?? "";
  return (billingItemTypes as readonly string[]).includes(s)
    ? (s as (typeof billingItemTypes)[number])
    : undefined;
}

export function BillingItemDialog({
  item,
  open,
  onOpenChange,
}: {
  item?: BillingItemRow;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { controlled, openState, setOpenState } = useFormDialog({
    open,
    onOpenChange,
  });
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
    setOpenState(next);
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
    setOpenState(false);
  }

  return (
    <FormDialog
      open={openState}
      onOpenChange={handleOpenChange}
      triggerLabel={controlled ? undefined : isEdit ? "Edit" : "Add billing item"}
      triggerVariant={isEdit ? "outline" : "default"}
      title={isEdit ? "Edit billing item" : "Add billing item"}
      description="Reusable fee line items added to invoices beyond the consultation fee."
      submitLabel={isEdit ? "Save changes" : "Create"}
      busy={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FieldGroup>
            <TextField
              label="Name"
              id="bill-name"
              placeholder="Dressing"
              autoFocus
              error={errors.name}
              {...register("name")}
            />
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
            <StatusField control={control} error={errors.status} />
          </FieldGroup>
    </FormDialog>
  );
}
