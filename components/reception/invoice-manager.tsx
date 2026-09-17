"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InvoiceBundle } from "@/db/queries/invoices";
import {
  invoiceUpdateSchema,
  type InvoiceUpdateFormValues,
} from "@/lib/validations/invoice";
import {
  addInvoiceItem,
  removeInvoiceItem,
  updateInvoice,
} from "@/app/reception/invoices/actions";

const money = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return "0.00";
  return Number(v).toFixed(2);
};

const paymentModes = ["Cash", "UPI", "Card", "Other"] as const;

export function InvoiceManager({
  bundle,
  masterItems,
}: {
  bundle: NonNullable<InvoiceBundle>;
  masterItems: { id: number; name: string; amount: string }[];
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

  async function onAddItem(billingItemId: number) {
    const result = await addInvoiceItem({
      appointmentId: bundle.id,
      billingItemId,
    });
    if (!result.ok) toast.error(result.error);
    else {
      toast.success("Charge added.");
      router.refresh();
    }
  }

  async function onRemoveItem(id: number) {
    const result = await removeInvoiceItem({ id });
    if (!result.ok) toast.error(result.error);
    else {
      toast.success("Charge removed.");
      router.refresh();
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
    <div className="flex max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            Token {bundle.tokenNumber} · {bundle.patient.name}
          </CardTitle>
          <CardDescription>
            {bundle.doctor.user.name} · {bundle.date} · Fee ₹
            {money(invoice.consultationFee)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-xs">
          {invoice.items.length === 0 ? (
            <p className="text-muted-foreground">
              No additional charges. Add from the billing master below.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {invoice.items.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between gap-2 border p-2"
                >
                  <span className="font-medium">{i.name}</span>
                  <span className="flex items-center gap-2">
                    ₹{money(i.amount)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void onRemoveItem(i.id)}
                    >
                      Remove
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-2">
            <Select
              value=""
              onValueChange={(v) => void onAddItem(Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add a charge…" />
              </SelectTrigger>
              <SelectContent>
                {masterItems.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name} · ₹{money(m.amount)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <dl className="mt-1 flex flex-col gap-1 border-t pt-2">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Discount</dt>
              <dd>₹{money(invoice.discount)}</dd>
            </div>
            <div className="flex justify-between font-medium">
              <dt>Total</dt>
              <dd>₹{money(invoice.totalAmount)}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Payment</dt>
              <dd>
                {invoice.paymentStatus === "paid" ? "Paid" : "Pending"}
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
              <div className="grid grid-cols-2 gap-3">
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
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
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
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pick…" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentModes.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
