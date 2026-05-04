"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  type LoginFormValues,
} from "../../../lib/validation/auth.schema";
import { useLoginMutation } from "../../../services/authApi";
import { useAppDispatch } from "../../../store/hooks";
import { setCredentials } from "../../../store/authSlice";
import { FormField } from "./FormField";
import { AuthField } from "@/src/enums/enum";

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const response = await login(values).unwrap();
      dispatch(setCredentials(response.user));
      router.push("/users");
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Login failed. Please try again.";
      setError("root", { message });
    }
  };

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

      <FormField
        id={AuthField.Password}
        label="Password"
        type="password"
        placeholder="••••••••"
        registration={register(AuthField.Password)}
        error={errors[AuthField.Password]}
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
        {isLoading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
