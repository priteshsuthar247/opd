import { minimalTheme } from "./pdf/theme-minimal";

// Default pdfcn theme for this app (registry alias module the CLI does
// not ship). Minimal = zinc neutrals, no corporate blue — suits clinical
// documents. pdfcn-theme.ts also imports `professionalTheme` from "@/components".
export { minimalTheme as professionalTheme } from "./pdf/theme-minimal";
export default minimalTheme;
