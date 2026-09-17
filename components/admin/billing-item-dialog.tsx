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
import type { BillingItemRow } from "@/db/queries/billing-items";
import {
  billingItemSchema,
  type BillingItemFormValues,
} from "@/lib/validations/billing-item";
import {
  createBillingItem,
  updateBillingItem,
} from "@/app/admin/billing-items/actions";

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
      type: item?.type ?? "",
      amount: item?.amount ?? "",
      status: item?.status ?? "active",
    },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next)
      reset({
        name: item?.name ?? "",
        type: item?.type ?? "",
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant={isEdit ? "outline" : "default"} size="sm">
            {isEdit ? "Edit" : "Add billing item"}
          </Button>
        }
      />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit billing item" : "Add billing item"}
          </DialogTitle>
          <DialogDescription>
            Reusable fee line items added to invoices beyond the consultation
            fee.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="bill-name">Name</FieldLabel>
              <Input
                id="bill-name"
                placeholder="Dressing"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={!!errors.type}>
              <FieldLabel htmlFor="bill-type">Type</FieldLabel>
              <Input
                id="bill-type"
                placeholder="Procedure"
                aria-invalid={!!errors.type}
                {...register("type")}
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
