import type { ReactNode } from "react";
import type { Style } from "@/lib/pdf-primitives";

// Shared prop contract for pdfcn PDF components (registry alias module
// the CLI does not ship — defined locally to match installed usage).
// style is singular: blocks compose arrays internally; callers pass one
// object or nothing.
export interface PDFComponentProps {
  children?: ReactNode;
  style?: Style;
}
