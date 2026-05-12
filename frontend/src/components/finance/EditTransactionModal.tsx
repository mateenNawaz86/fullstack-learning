"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateTransactionSchema,
  type UpdateTransactionFormValues,
} from "../../lib/validation/finance.schema";
import {
  useUpdateTransactionMutation,
  useGetCategoriesQuery,
  useGetAccountsQuery,
} from "../../services/financeApi";
import type { Transaction } from "../../types/finance";

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

interface EditTransactionModalProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
}

export function EditTransactionModal({
  transaction,
  isOpen,
  onClose,
}: EditTransactionModalProps) {
  const [updateTransaction, { isLoading }] = useUpdateTransactionMutation();
  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: accountsData } = useGetAccountsQuery();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<UpdateTransactionFormValues>({
    resolver: zodResolver(updateTransactionSchema),
  });

  const selectedType = watch("type");

  // Re-populate the form each time the modal opens with fresh transaction data
  useEffect(() => {
    if (isOpen) {
      reset({
        title: transaction.title,
        amount: transaction.amount,
        type: transaction.type,
        // category and account come from populate() as objects, extract the _id
        category: transaction.category._id,
        account: transaction.account._id,
        // Slice to YYYY-MM-DD for the HTML date input
        date: transaction.date.slice(0, 10),
        notes: transaction.notes ?? "",
      });
    }
  }, [isOpen, transaction, reset]);

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: UpdateTransactionFormValues) => {
    try {
      const formData = new FormData();
      // Only append fields that have a value — PATCH sends only what changed
      if (values.title) formData.append("title", values.title);
      if (values.amount) formData.append("amount", String(values.amount));
      if (values.type) formData.append("type", values.type);
      if (values.category) formData.append("category", values.category);
      if (values.account) formData.append("account", values.account);
      if (values.date) formData.append("date", values.date);
      if (values.notes?.trim()) formData.append("notes", values.notes.trim());

      const fileList = values.receipt as FileList | undefined;
      if (fileList?.[0]) formData.append("receipt", fileList[0]);

      await updateTransaction({ id: transaction._id, formData }).unwrap();
      handleClose();
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Failed to update transaction.";
      setError("root", { message });
    }
  };

  const filteredCategories =
    categoriesData?.categories.filter((c) => c.type === selectedType) ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-white/10 bg-gray-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-5 text-lg font-semibold text-white">Edit Transaction</h2>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Type */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">Type</label>
            <div className="flex rounded-lg border border-white/10 p-1">
              {(["expense", "income"] as const).map((t) => (
                <label
                  key={t}
                  className={`flex-1 cursor-pointer rounded-md py-2 text-center text-sm font-medium transition-colors ${
                    selectedType === t
                      ? t === "income"
                        ? "bg-emerald-600 text-white"
                        : "bg-red-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <input type="radio" value={t} className="sr-only" {...register("type")} />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Title + Amount */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Title</label>
              <input
                type="text"
                disabled={isLoading}
                className={inputClass(!!errors.title)}
                {...register("title")}
              />
              {errors.title && (
                <p role="alert" className="text-xs text-red-400">{errors.title.message}</p>
              )}
            </div>
            <div className="w-36 space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                disabled={isLoading}
                className={inputClass(!!errors.amount)}
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p role="alert" className="text-xs text-red-400">{errors.amount.message}</p>
              )}
            </div>
          </div>

          {/* Category + Account */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Category</label>
              <select disabled={isLoading} className={selectClass(!!errors.category)} {...register("category")}>
                <option value="">Select category</option>
                {filteredCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              {errors.category && (
                <p role="alert" className="text-xs text-red-400">{errors.category.message}</p>
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Account</label>
              <select disabled={isLoading} className={selectClass(!!errors.account)} {...register("account")}>
                <option value="">Select account</option>
                {accountsData?.accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>{acc.name}</option>
                ))}
              </select>
              {errors.account && (
                <p role="alert" className="text-xs text-red-400">{errors.account.message}</p>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">Date</label>
            <input type="date" disabled={isLoading} className={inputClass(!!errors.date)} {...register("date")} />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">
              Notes <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <textarea
              rows={2}
              disabled={isLoading}
              className={[inputClass(!!errors.notes), "resize-none"].join(" ")}
              {...register("notes")}
            />
          </div>

          {/* Receipt replacement */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">
              Replace Receipt{" "}
              <span className="font-normal text-gray-500">(optional)</span>
            </label>
            {transaction.receiptUrl && (
              <a
                href={transaction.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-1.5 inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
              >
                View current receipt ↗
              </a>
            )}
            <input
              type="file"
              accept="image/*"
              disabled={isLoading}
              className="w-full cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-400 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-1 file:text-xs file:font-medium file:text-white hover:file:bg-indigo-500 disabled:opacity-50"
              {...register("receipt")}
            />
          </div>

          {errors.root && (
            <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
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
              {isLoading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
