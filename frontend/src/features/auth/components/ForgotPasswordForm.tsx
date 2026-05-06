"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "../../../lib/validation/auth.schema";
import { useForgotPasswordMutation } from "../../../services/authApi";
import { FormField } from "./FormField";
import { AuthField } from "@/src/enums/enum";

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await forgotPassword(values).unwrap();
      setSubmitted(true);
    } catch {
      setError("root", { message: "Something went wrong. Please try again." });
    }
  };

  if (submitted) {
    return (
      <p className="text-center text-sm text-gray-300">
        If that email is registered, you&apos;ll receive a reset link shortly.
        Check your inbox (and spam folder).
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormField
        id={AuthField.Email}
        label="Email address"
        type="email"
        placeholder="you@example.com"
        registration={register(AuthField.Email)}
        error={errors[AuthField.Email]}
        disabled={isLoading}
      />

      {errors.root && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {errors.root.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="cursor-pointer w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
