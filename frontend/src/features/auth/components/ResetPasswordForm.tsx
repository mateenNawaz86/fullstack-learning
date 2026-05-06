"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "../../../lib/validation/auth.schema";
import { useResetPasswordMutation } from "../../../services/authApi";
import { FormField } from "./FormField";
import { AuthField } from "@/src/enums/enum";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [success, setSuccess] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    try {
      await resetPassword({ token, password: values[AuthField.Password] }).unwrap();
      setSuccess(true);
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Failed to reset password. The link may have expired.";
      setError("root", { message });
    }
  };

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-gray-300">
          Your password has been reset successfully.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormField
        id={AuthField.Password}
        label="New password"
        type="password"
        placeholder="••••••••"
        registration={register(AuthField.Password)}
        error={errors[AuthField.Password]}
        disabled={isLoading}
      />

      <FormField
        id={AuthField.ConfirmPassword}
        label="Confirm new password"
        type="password"
        placeholder="••••••••"
        registration={register(AuthField.ConfirmPassword)}
        error={errors[AuthField.ConfirmPassword]}
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
        {isLoading ? "Resetting…" : "Reset password"}
      </button>
    </form>
  );
}
