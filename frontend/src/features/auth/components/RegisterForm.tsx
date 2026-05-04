"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  type RegisterFormValues,
} from "../../../lib/validation/auth.schema";
import { AuthField } from "@/src/enums/enum";
import { useRegisterMutation } from "../../../services/authApi";
import { FormField } from "./FormField";

export function RegisterForm() {
  const router = useRouter();
  const [registerUser, { isLoading }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    const { [AuthField.ConfirmPassword]: _confirm, ...payload } = values;

    try {
      await registerUser(payload).unwrap();
      router.push("/login");
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Registration failed. Please try again.";
      setError("root", { message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormField
        id={AuthField.Name}
        label="Full name"
        placeholder="John Doe"
        registration={register(AuthField.Name)}
        error={errors[AuthField.Name]}
        disabled={isLoading}
      />

      <FormField
        id={AuthField.Email}
        label="Email address"
        type="email"
        placeholder="you@example.com"
        registration={register(AuthField.Email)}
        error={errors[AuthField.Email]}
        disabled={isLoading}
      />

      <FormField
        id={AuthField.Password}
        label="Password"
        type="password"
        placeholder="••••••••"
        registration={register(AuthField.Password)}
        error={errors[AuthField.Password]}
        disabled={isLoading}
      />

      <FormField
        id={AuthField.ConfirmPassword}
        label="Confirm password"
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
        {isLoading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
