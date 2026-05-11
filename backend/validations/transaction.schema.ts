import { z } from "zod";

// WHY z.coerce here but not in category/account schemas?
// Transactions use multipart/form-data (because of the receipt file upload).
// In multipart forms, ALL text fields arrive as strings — even numbers and dates.
// z.coerce.number("100") → 100 (number)
// z.coerce.date("2025-04-01") → Date object
// Without coerce, Zod would reject "100" because it's not a number type.

export const createTransactionSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(1, "Title is required")
    .max(100, "Title must be at most 100 characters"),

  amount: z.coerce
    .number({ error: "Amount is required" })
    .positive("Amount must be greater than 0"),

  type: z.enum(["income", "expense"], {
    message: "Type must be 'income' or 'expense'",
  }),

  // These are MongoDB ObjectId strings — we validate them as non-empty strings here.
  // The controller does a second check (.findOne with user scope) to confirm they exist
  // and actually belong to the current user.
  category: z
    .string({ error: "Category is required" })
    .min(1, "Category is required"),

  account: z
    .string({ error: "Account is required" })
    .min(1, "Account is required"),

  date: z.coerce.date().optional(), // "2025-04-01" string → Date object

  notes: z.string().max(500, "Notes must be at most 500 characters").optional(),
});

// For PATCH: all fields are optional — client sends only what changed.
export const updateTransactionSchema = createTransactionSchema.partial();
