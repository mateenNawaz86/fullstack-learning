"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createAccountSchema,
  type CreateAccountFormValues,
} from "../../lib/validation/finance.schema";
import { useCreateAccountMutation } from "../../services/financeApi";

// Reusable input className helper — same pattern as todo forms
const inputClass = (hasError: boolean) =>
  [
    "w-full rounded-lg border bg-white/5 px-4 py-2.5 text-sm text-white",
    "placeholder:text-gray-500 outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    hasError
      ? "border-red-500/60 focus:ring-2 focus:ring-red-500/30"
      : "border-white/10 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20",
  ].join(" ");

const selectClass = (hasError: boolean) =>
  [
    "w-full rounded-lg border bg-gray-900 px-4 py-2.5 text-sm text-white",
    "outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    hasError
      ? "border-red-500/60 focus:ring-2 focus:ring-red-500/30"
      : "border-white/10 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20",
  ].join(" ");

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAccountModal({ isOpen, onClose }: CreateAccountModalProps) {
  const [createAccount, { isLoading }] = useCreateAccountMutation();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: { currency: "PKR", balance: 0 },
  });

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: CreateAccountFormValues) => {
    try {
      await createAccount(values).unwrap();
      handleClose();
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Failed to create account.";
      setError("root", { message });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-white/10 bg-gray-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-5 text-lg font-semibold text-white">New Account</h2>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">Name</label>
            <input
              type="text"
              placeholder="e.g. Cash Wallet, HBL Savings"
              disabled={isLoading}
              className={inputClass(!!errors.name)}
              {...register("name")}
            />
            {errors.name && (
              <p role="alert" className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">Type</label>
            <select
              disabled={isLoading}
              className={selectClass(!!errors.type)}
              {...register("type")}
            >
              <option value="">Select type</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="credit_card">Credit Card</option>
              <option value="savings">Savings</option>
            </select>
            {errors.type && (
              <p role="alert" className="text-xs text-red-400">{errors.type.message}</p>
            )}
          </div>

          {/* Opening balance + currency (side by side) */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">
                Opening Balance
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                disabled={isLoading}
                className={inputClass(!!errors.balance)}
                {...register("balance", { valueAsNumber: true })}
              />
            </div>
            <div className="w-28 space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Currency</label>
              <input
                type="text"
                maxLength={3}
                placeholder="PKR"
                disabled={isLoading}
                className={inputClass(!!errors.currency)}
                {...register("currency")}
              />
              {errors.currency && (
                <p role="alert" className="text-xs text-red-400">{errors.currency.message}</p>
              )}
            </div>
          </div>

          {errors.root && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {errors.root.message}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 cursor-pointer rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 cursor-pointer rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {isLoading ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
