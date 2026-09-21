"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LockIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentBadge } from "@/components/billing/status-badges";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormCombobox } from "@/components/ui/form-combobox";
import { paymentModes, paymentStatusOptions } from "@/lib/options";
import {
  invoiceUpdateSchema,
  type InvoiceUpdateFormValues,
} from "@/lib/validations/invoice";

// Structural bundle: the manager only reads these fields, so both the
// server-rendered page bundle (Date objects) and the dialog's serialized
// bundle (ISO strings) satisfy it without lossy casts at call sites.
export type ManagerBundle = {
  id: number;
  tokenNumber: number;
  date: string;
  patient: { name: string };
  doctor: { user: { name: string } };
  invoice: {
    consultationFee: string;
    discount: string;
    totalAmount: string;
    paymentStatus: "pending" | "paid";
    paymentMode: string | null;
    items: { id: number; name: string; amount: string }[];
  } | null;
};
import {
  addInvoiceItem,
  removeInvoiceItem,
  updateInvoice,
} from "@/app/reception/invoices/actions";

const money = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return "0.00";
  return Number(v).toFixed(2);
};

export function InvoiceManager({
  bundle,
  masterItems,
  onChanged,
}: {
  bundle: ManagerBundle;
  masterItems: { id: number; name: string; amount: string }[];
  // Called after any successful mutation so dialog hosts (whose bundle
  // is client state) can refetch. Page hosts rely on revalidation.
  onChanged?: () => void;
}) {
  const router = useRouter();
  const invoice = bundle.invoice;

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceUpdateFormValues>({
    resolver: zodResolver(invoiceUpdateSchema),
    defaultValues: {
      appointmentId: bundle.id,
      discount: invoice ? money(invoice.discount) : "0",
      paymentStatus: invoice?.paymentStatus ?? "pending",
      paymentMode: invoice?.paymentMode ?? "",
    },
  });
  const paymentStatus = watch("paymentStatus");
  // Optimistic adds: the row appears instantly while the server roundtrip
  // (slow in dev, fast in prod) confirms. Cleared on error or on the
  // parent remount that follows a successful refetch.
  const [pendingIds, setPendingIds] = useState<number[]>([]);

  async function onAddItem(billingItemId: number) {
    setPendingIds((prev) => [...prev, billingItemId]);
    const result = await addInvoiceItem({
      appointmentId: bundle.id,
      billingItemId,
    });
    if (!result.ok) {
      toast.error(result.error);
      setPendingIds((prev) => prev.filter((id) => id !== billingItemId));
      return;
    }
    toast.success("Charge added.");
    router.refresh();
    onChanged?.();
  }

  async function onRemoveItem(id: number) {
    const result = await removeInvoiceItem({ id });
    if (!result.ok) toast.error(result.error);
    else {
      toast.success("Charge removed.");
      router.refresh();
      onChanged?.();
    }
  }

  async function onUpdate(data: InvoiceUpdateFormValues) {
    const result = await updateInvoice(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Invoice updated.");
    router.refresh();
    onChanged?.();
  }

  if (!invoice) {
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>No invoice yet</CardTitle>
          <CardDescription>
            Invoices are created automatically at booking time.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            Token {bundle.tokenNumber} · {bundle.patient.name}
          </CardTitle>
          <CardDescription>
            {bundle.doctor.user.name} · {bundle.date}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <ul className="flex flex-col divide-y rounded-md border">
            <li className="flex items-center justify-between gap-2 px-3 py-2.5">
              <span className="flex items-center gap-2 font-medium">
                Consultation fee
                <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <LockIcon className="size-3" />
                  fixed
                </span>
              </span>
              <span>₹{money(invoice.consultationFee)}</span>
            </li>
            {invoice.items.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between gap-2 px-3 py-2.5"
              >
                <span className="font-medium">{i.name}</span>
                <span className="flex items-center gap-1">
                  ₹{money(i.amount)}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${i.name}`}
                    onClick={() => void onRemoveItem(i.id)}
                  >
                    <Trash2Icon />
                  </Button>
                </span>
              </li>
            ))}
            {pendingIds.map((id) => {
              const m = masterItems.find((x) => x.id === id);
              if (!m) return null;
              return (
                <li
                  key={`pending-${id}`}
                  className="flex animate-pulse items-center justify-between gap-2 px-3 py-2.5 text-muted-foreground"
                >
                  <span className="font-medium">{m.name}</span>
                  <span>₹{money(m.amount)}</span>
                </li>
              );
            })}
          </ul>
          <FormCombobox
            value=""
            label="Add a charge"
            onValueChange={(v) => void onAddItem(Number(v))}
            options={masterItems.map((m) => ({
              value: String(m.id),
              label: `${m.name} · ₹${money(m.amount)}`,
            }))}
            placeholder="Add a charge…"
          />
          <Separator />
          <dl className="flex flex-col gap-1 pt-3">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Discount</dt>
              <dd>₹{money(invoice.discount)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <dt>Total</dt>
              <dd>₹{money(invoice.totalAmount)}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Payment</dt>
              <dd className="flex items-center gap-1">
                <PaymentBadge status={invoice.paymentStatus} />
                {invoice.paymentMode ? ` · ${invoice.paymentMode}` : ""}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
          <CardDescription>
            Discount, status and mode. Totals recompute server-side.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onUpdate)}>
            <FieldGroup>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field data-invalid={!!errors.discount}>
                  <FieldLabel htmlFor="inv-discount">Discount (₹)</FieldLabel>
                  <Input
                    id="inv-discount"
                    inputMode="decimal"
                    {...register("discount")}
                  />
                  <FieldError errors={[errors.discount]} />
                </Field>
                <Field data-invalid={!!errors.paymentStatus}>
                  <FieldLabel>Status</FieldLabel>
                  <Controller
                    control={control}
                  name="paymentStatus"
                  render={({ field, fieldState }) => (
                    <FormCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      label="Status"
                      invalid={!!fieldState.error}
                      options={[...paymentStatusOptions]}
                    />
                  )}
                  />
                  <FieldError errors={[errors.paymentStatus]} />
                </Field>
              </div>
              {paymentStatus === "paid" && (
                <Field data-invalid={!!errors.paymentMode}>
                  <FieldLabel>Mode</FieldLabel>
                  <Controller
                    control={control}
                    name="paymentMode"
                    render={({ field, fieldState }) => (
                      <FormCombobox
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        label="Mode"
                        invalid={!!fieldState.error}
                        options={paymentModes.map((m) => ({
                          value: m,
                          label: m,
                        }))}
                        placeholder="Pick…"
                      />
                    )}
                  />
                  <FieldError errors={[errors.paymentMode]} />
                </Field>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save invoice"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
