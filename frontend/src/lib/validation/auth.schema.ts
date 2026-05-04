import { z } from "zod";
import { AuthField } from "@/src/enums/enum";

export const loginSchema = z.object({
  [AuthField.Email]: z
    .string()
    .min(1, "Email is required")
    .check(z.email({ message: "Please enter a valid email address" })),

  // Login only needs non-empty — length/complexity rules are for registration.
  // Enforcing them here would lock out users whose password predates those rules.
  [AuthField.Password]: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    [AuthField.Name]: z
      .string()
      .min(3, "Name must be at least 3 characters")
      .max(50, "Name must be at most 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "Name may only contain letters and spaces"),

    [AuthField.Email]: z
      .string()
      .min(1, "Email is required")
      .check(z.email({ message: "Please enter a valid email address" })),

    [AuthField.Password]: z
      .string()
      .min(6, "Password must be at least 6 characters"),

    [AuthField.ConfirmPassword]: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine(
    (data) => data[AuthField.Password] === data[AuthField.ConfirmPassword],
    {
      message: "Passwords do not match",
      path: [AuthField.ConfirmPassword],
    },
  );

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
