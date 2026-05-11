import { z } from "zod";

// Zod schemas are the single source of truth for what valid input looks like.
// They are used by the validate() middleware — NOT directly in controllers.
//
// Zod v4 change: use `error` instead of the old `required_error` / `invalid_type_error`.

export const createCategorySchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(50, "Name must be at most 50 characters"),

  type: z.enum(["income", "expense"], {
    message: "Type must be 'income' or 'expense'",
  }),

  color: z.string().optional(), // frontend picks the color; backend just stores it
});

// .partial() makes every field optional — perfect for PATCH requests where
// the client only sends the fields it wants to change.
export const updateCategorySchema = createCategorySchema.partial();
