import { z } from "zod";

export const createAccountSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(50, "Name must be at most 50 characters"),

  type: z.enum(["cash", "bank", "credit_card", "savings"], {
    message: "Type must be cash, bank, credit_card, or savings",
  }),

  // z.coerce.number() handles the case where the client sends a JSON number OR a string "5000".
  // Accounts are created via JSON (not multipart), but coerce keeps it flexible.
  balance: z.coerce.number().optional(),

  // .transform() runs after validation — it converts "pkr" → "PKR" so the
  // DB always stores an uppercase currency code regardless of what the client sent.
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter ISO code (e.g. PKR, USD)")
    .transform((s) => s.toUpperCase())
    .optional(),
});

export const updateAccountSchema = createAccountSchema.partial();
