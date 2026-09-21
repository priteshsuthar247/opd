import { Document, Page } from "@/lib/pdf-primitives";
import { PdfcnThemeProvider } from "@/components/pdf/theme-provider";
import { Text } from "@/components/pdf/text/text";
import { minimalTheme } from "@/components/pdf/theme-minimal";
import type { ConsultationBundle } from "@/db/queries/clinical";

// Server-side prescription document (pdfcn/Takumi primitives only —
// never screen components). Mirrors the retired print layout 1:1 so
// output parity is checkable field-for-field.
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
          <Text variant="xl" weight="bold">
            {doctor.user.name}
          </Text>
          <Text variant="sm">
            {doctor.qualification ?? ""}
            {doctor.registrationNo ? ` · Reg. ${doctor.registrationNo}` : ""}
          </Text>
          <Text variant="sm">{doctor.department.name}</Text>

          <Text variant="base" weight="semibold">
            Patient: {patient.name} · {patient.phone}
          </Text>
          <Text variant="sm">
            Date: {bundle.date} · Token {bundle.tokenNumber}
          </Text>
          {consultation?.diagnosis && (
            <Text variant="sm">Diagnosis: {consultation.diagnosis}</Text>
          )}
          {consultation?.chiefComplaint && (
            <Text variant="sm">
              Complaint: {consultation.chiefComplaint}
            </Text>
          )}

          <Text variant="lg" weight="semibold">
            Prescription
          </Text>
          {items.length > 0 ? (
            <Text variant="sm">
              {items
                .map(
                  (item, idx) =>
                    `${idx + 1}. ${item.medicine?.name ?? item.freeTextName ?? "—"} — ${item.dosage}, ${item.frequency} × ${item.duration}${item.instructions ? ` (${item.instructions})` : ""}`
                )
                .join("\n")}
            </Text>
          ) : (
            <Text variant="sm">No medicines prescribed.</Text>
          )}

          {consultation?.notes && (
            <Text variant="sm">Notes: {consultation.notes}</Text>
          )}
          {consultation?.followUpRequired && (
            <Text variant="sm">
              Follow-up: {consultation.followUpDate ?? "required"}
            </Text>
          )}

          <Text variant="sm">
            Status: {prescription?.status ?? "no prescription"}
          </Text>
          <Text variant="sm" align="right">
            {doctor.user.name}
          </Text>
        </PdfcnThemeProvider>
      </Page>
    </Document>
  );
}
