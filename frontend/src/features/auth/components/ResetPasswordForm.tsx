"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "../../../lib/validation/auth.schema";
import {
  useResetPasswordMutation,
  useValidateResetTokenQuery,
} from "../../../services/authApi";
import { FormField } from "./FormField";
import { AuthField } from "@/src/enums/enum";
import type { TokenInvalidReason } from "@/src/types/auth";
import { FormHeading } from "@/src/components/ui/form-heading";
import { TokenCheckingSkeleton } from "@/src/components/ui/token-checking-skeleton";
import { PasswordUpdateSuccess } from "@/src/components/ui/password-update-success";
import { TokenInvalidScreen } from "@/src/components/ui/invalid-token-screen";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [success, setSuccess] = useState(false);
  const [resetPassword, { isLoading: isResetting }] =
    useResetPasswordMutation();

  const {
    data: validation,
    isLoading: isValidating,
    isError: isValidationError,
    error: validationError,
  } = useValidateResetTokenQuery(token);

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
      await resetPassword({
        token,
        password: values[AuthField.Password],
      }).unwrap();
      setSuccess(true);
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Failed to reset password. The link may have expired.";
      setError("root", { message });
    }
  };

  if (isValidating) {
    return <TokenCheckingSkeleton />;
  }

  if (isValidationError || !validation?.success) {
    const reason: TokenInvalidReason =
      (validationError as { data?: { reason?: TokenInvalidReason } })?.data
        ?.reason ??
      (validation as { reason?: TokenInvalidReason } | undefined)?.reason ??
      "invalid";
    return <TokenInvalidScreen reason={reason} />;
  }

  if (success) {
    return <PasswordUpdateSuccess />;
  }

  return (
    <>
      <FormHeading
        heading="Set a new password"
        subheading="Choose a strong password for your account."
      />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormField
          id={AuthField.Password}
          label="New password"
          type="password"
          placeholder="••••••••"
          registration={register(AuthField.Password)}
          error={errors[AuthField.Password]}
          disabled={isResetting}
        />

        <FormField
          id={AuthField.ConfirmPassword}
          label="Confirm new password"
          type="password"
          placeholder="••••••••"
          registration={register(AuthField.ConfirmPassword)}
          error={errors[AuthField.ConfirmPassword]}
          disabled={isResetting}
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
          disabled={isResetting}
          className="cursor-pointer w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isResetting ? "Resetting…" : "Reset password"}
        </button>
      </form>
    </>
  );
}
