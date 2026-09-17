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
