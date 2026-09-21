import { Document, Page } from "@/lib/pdf-primitives";
import { PdfcnThemeProvider } from "@/components/pdf/theme-provider";
import { Text } from "@/components/pdf/text/text";
import { Section } from "@/components/pdf/section/section";
import { KeyValue } from "@/components/pdf/key-value/key-value";
import { Divider } from "@/components/pdf/divider/divider";
import { PdfSignatureBlock } from "@/components/pdf/signature/signature";
import { PageHeader } from "@/components/pdf/page-header/page-header";
import { PageFooter } from "@/components/pdf/page-footer/page-footer";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from "@/components/pdf/table/table";
import { minimalTheme } from "@/components/pdf/theme-minimal";
import type { InvoiceBundle } from "@/db/queries/invoices";

// Server-side invoice document built from pdfcn blocks — never screen
// components, never hand-rolled PDF markup. Same fields as the retired
// print layout: header, parties, charge table with totals footer,
// payment line, signature.
export function InvoicePdf({
  bundle,
}: {
  bundle: NonNullable<InvoiceBundle> & { invoice: NonNullable<NonNullable<InvoiceBundle>["invoice"]> };
}) {
  const invoice = bundle.invoice;
  const money = (v: string | number) => Number(v).toFixed(2);
  const rows: { no: number; item: string; amount: string }[] = [
    { no: 1, item: "Consultation fee", amount: money(invoice.consultationFee) },
    ...invoice.items.map((item, idx) => ({
      no: idx + 2,
      item: item.name,
      amount: money(item.amount),
    })),
  ];

  return (
    <Document title={`Invoice - Token ${bundle.tokenNumber}`}>
      <Page size="A4">
        <PdfcnThemeProvider theme={minimalTheme}>
          <PageHeader
            title="OPD Clinic"
            subtitle="Consultation Invoice"
            rightText={`Token ${bundle.tokenNumber}`}
            rightSubText={bundle.date}
          />

          <Section>
            <KeyValue
              items={[
                {
                  key: "Patient",
                  value: `${bundle.patient.name} · ${bundle.patient.phone}`,
                },
                {
                  key: "Doctor",
                  value: `${bundle.doctor.user.name} · ${bundle.doctor.department.name}`,
                },
                {
                  key: "Payment",
                  value: `${invoice.paymentStatus === "paid" ? "Paid" : "Pending"}${invoice.paymentMode ? ` · ${invoice.paymentMode}` : ""}`,
                },
              ]}
            />
          </Section>

          <Section>
            <Table variant="line">
              <TableHeader>
                <TableRow header>
                  <TableCell header>#</TableCell>
                  <TableCell header>Item</TableCell>
                  <TableCell header align="right">
                    Amount (₹)
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.no}>
                    <TableCell>{r.no}</TableCell>
                    <TableCell>{r.item}</TableCell>
                    <TableCell align="right">{r.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow footer>
                  <TableCell footer />
                  <TableCell footer>Discount</TableCell>
                  <TableCell footer align="right">
                    ₹{money(invoice.discount)}
                  </TableCell>
                </TableRow>
                <TableRow footer>
                  <TableCell footer />
                  <TableCell footer>Total</TableCell>
                  <TableCell footer align="right">
                    ₹{money(invoice.totalAmount)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </Section>

          <Divider />

          <PdfSignatureBlock label="Received with thanks" date={bundle.date} />

          <PageFooter
            leftText={`Appointment #${bundle.id}`}
            rightText={`Total ₹${money(invoice.totalAmount)}`}
          />
        </PdfcnThemeProvider>
      </Page>
    </Document>
  );
}
