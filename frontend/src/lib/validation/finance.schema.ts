import { z } from "zod";

// ─── Category ─────────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50, "Max 50 characters"),
  type: z.enum(["income", "expense"], { message: "Select income or expense" }),
  color: z.string().optional(),
});

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;

// ─── Account ──────────────────────────────────────────────────────────────────

export const createAccountSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50, "Max 50 characters"),
  type: z.enum(["cash", "bank", "credit_card", "savings"], {
    message: "Select an account type",
  }),
  // valueAsNumber: true on the input passes a number directly; no coerce needed
  balance: z.number().optional(),
  currency: z
    .string()
    .length(3, "Must be a 3-letter code, e.g. PKR")
    .toUpperCase()
    .optional(),
});

export type CreateAccountFormValues = z.infer<typeof createAccountSchema>;

// ─── Transaction ──────────────────────────────────────────────────────────────
// These are the form field values — NOT what gets sent to the API.
// The submit handler builds a FormData from these before calling the API.
// That way Zod validates clean TS types, and we handle the multipart construction separately.

export const createTransactionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Max 100 characters"),
  // valueAsNumber: true on the input converts the string to number before Zod validates
  amount: z.number({ error: "Enter a valid amount" }).positive("Must be greater than 0"),
  type: z.enum(["income", "expense"], { message: "Select income or expense" }),
  category: z.string().min(1, "Select a category"),
  account: z.string().min(1, "Select an account"),
  // HTML date input returns "YYYY-MM-DD" string — keep as string, backend coerces to Date
  date: z.string().optional(),
  notes: z.string().max(500, "Max 500 characters").optional(),
  // z.any() because FileList is a browser-only API and would break SSR with z.instanceof()
  receipt: z.any().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export type CreateTransactionFormValues = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionFormValues = z.infer<typeof updateTransactionSchema>;
