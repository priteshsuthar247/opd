// Single source for fixed dropdown lists: Zod enums and UI selects both
// import from here so labels and values can never drift apart.

export const bloodGroups = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

export const medicineForms = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Sachet",
  "Drops",
  "Ointment",
  "Other",
] as const;

export const billingItemTypes = [
  "Procedure",
  "Charge",
  "Service",
  "Other",
] as const;

export const paymentModes = ["Cash", "UPI", "Card", "Other"] as const;

// Closed-trigger labels: Base UI resolves the selected text from mounted
// items, so a closed select falls back to the raw value. Every Select
// below passes one of these maps via the `items` prop — keep them next
// to the option lists so value and label can never drift.
export const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export const paymentStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
] as const;

export const genderLabels = {
  male: "Male",
  female: "Female",
  other: "Other",
} as const;

export const categoryTypeLabels = {
  diagnosis: "Diagnosis",
  symptom: "Symptom",
  complaint: "Complaint",
} as const;

export const paymentStatusLabels = {
  pending: "Pending",
  paid: "Paid",
} as const;

export const appointmentTypeLabels = {
  walk_in: "Walk-in",
  scheduled: "Scheduled",
} as const;

export function idLabelMap(list: { id: number; name: string }[]) {
  return Object.fromEntries(list.map((o) => [String(o.id), o.name]));
}
