import { z } from "zod";

export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be at most 100 characters"),

  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),
});

export const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be at most 100 characters"),

  // Empty string is treated as "no description" — stored as undefined before sending
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),
});

export type CreateTodoFormValues = z.infer<typeof createTodoSchema>;
export type UpdateTodoFormValues = z.infer<typeof updateTodoSchema>;
