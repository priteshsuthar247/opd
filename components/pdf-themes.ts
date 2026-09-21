// Registry alias module the CLI does not ship — re-exports the local
// theme types so installed pdfcn components resolve.
export type {
  PdfcnTheme,
  ColorTokens,
  PrimitiveTokens,
} from "./pdf/theme-types";
