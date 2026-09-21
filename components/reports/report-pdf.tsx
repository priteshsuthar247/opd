import { Document, Page } from "@/lib/pdf-primitives";
import { PdfcnThemeProvider } from "@/components/pdf/theme-provider";
import { Text } from "@/components/pdf/text/text";
import { Section } from "@/components/pdf/section/section";
import { Divider } from "@/components/pdf/divider/divider";
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
import type { ReportTable } from "@/lib/report-data";

// Generic report document: every admin report (daily, trend,
// performance, custom, patient visits) renders through this with the
// same header/table/footer chrome. Empty tables show a line instead.
export function ReportPdf({ report }: { report: ReportTable }) {
  return (
    <Document title={report.title}>
      <Page size="A4">
        <PdfcnThemeProvider theme={minimalTheme}>
          <PageHeader title="OPD Clinic" subtitle={report.title} />
          <Section>
            <Text variant="sm">{report.subtitle}</Text>
          </Section>
          {report.rows.length > 0 ? (
            <Section>
              <Table variant="line">
                <TableHeader>
                  <TableRow header>
                    {report.columns.map((c) => (
                      <TableCell key={c} header>
                        {c}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.rows.map((row, i) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => (
                        <TableCell key={j}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Section>
          ) : (
            <Section>
              <Text variant="sm">No rows match.</Text>
            </Section>
          )}
          <Divider />
          <PageFooter
            leftText={report.title}
            rightText={report.subtitle}
          />
        </PdfcnThemeProvider>
      </Page>
    </Document>
  );
}
