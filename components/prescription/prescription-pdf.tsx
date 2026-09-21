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
  TableHeader,
  TableRow,
} from "@/components/pdf/table/table";
import { minimalTheme } from "@/components/pdf/theme-minimal";
import type { ConsultationBundle } from "@/db/queries/clinical";

// Server-side prescription document built from pdfcn blocks (Table,
// Section, KeyValue, Signature, PageHeader/Footer) — never screen
// components, never hand-rolled PDF markup. Same fields as the retired
// print layout, structured instead of newline-joined text.
export function PrescriptionPdf({
  bundle,
}: {
  bundle: NonNullable<ConsultationBundle>;
}) {
  const { consultation, patient, doctor } = bundle;
  const prescription = consultation?.prescription;
  const items = prescription?.items ?? [];

  return (
    <Document title={`Prescription - Token ${bundle.tokenNumber}`}>
      <Page size="A4">
        <PdfcnThemeProvider theme={minimalTheme}>
          <PageHeader
            title={doctor.user.name}
            subtitle={[
              doctor.qualification ?? "",
              doctor.registrationNo
                ? `Reg. ${doctor.registrationNo}`
                : "",
              doctor.department.name,
            ]
              .filter(Boolean)
              .join(" · ")}
            rightText={`Token ${bundle.tokenNumber}`}
            rightSubText={bundle.date}
          />

          <Section>
            <KeyValue
              items={[
                { key: "Patient", value: patient.name },
                { key: "Phone", value: patient.phone },
                ...(consultation?.diagnosis
                  ? [{ key: "Diagnosis", value: consultation.diagnosis }]
                  : []),
                ...(consultation?.chiefComplaint
                  ? [
                      {
                        key: "Complaint",
                        value: consultation.chiefComplaint,
                      },
                    ]
                  : []),
              ]}
            />
          </Section>

          <Section>
            <Text variant="lg" weight="semibold">
              Prescription
            </Text>
            {items.length > 0 ? (
              <Table variant="line">
                <TableHeader>
                  <TableRow header>
                    <TableCell header>#</TableCell>
                    <TableCell header>Medicine</TableCell>
                    <TableCell header>Dosage</TableCell>
                    <TableCell header>Frequency</TableCell>
                    <TableCell header>Duration</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        {item.medicine?.name ??
                          item.freeTextName ??
                          "—"}
                        {item.instructions
                          ? ` (${item.instructions})`
                          : ""}
                      </TableCell>
                      <TableCell>{item.dosage}</TableCell>
                      <TableCell>{item.frequency}</TableCell>
                      <TableCell>{item.duration}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Text variant="sm">No medicines prescribed.</Text>
            )}
          </Section>

          {(consultation?.notes || consultation?.followUpRequired) && (
            <Section>
              {consultation.notes && (
                <Text variant="sm">Notes: {consultation.notes}</Text>
              )}
              {consultation.followUpRequired && (
                <Text variant="sm">
                  Follow-up: {consultation.followUpDate ?? "required"}
                </Text>
              )}
            </Section>
          )}

          <Divider />

          <PdfSignatureBlock
            variant="single"
            label="Doctor"
            name={doctor.user.name}
            date={bundle.date}
          />

          <PageFooter
            leftText={`Status: ${prescription?.status ?? "no prescription"}`}
            rightText={`Token ${bundle.tokenNumber}`}
          />
        </PdfcnThemeProvider>
      </Page>
    </Document>
  );
}
