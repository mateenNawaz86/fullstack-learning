"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTransactionSchema,
  type CreateTransactionFormValues,
} from "../../lib/validation/finance.schema";
import {
  useCreateTransactionMutation,
  useGetCategoriesQuery,
  useGetAccountsQuery,
} from "../../services/financeApi";

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

interface CreateTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTransactionModal({
  isOpen,
  onClose,
}: CreateTransactionModalProps) {
  const [createTransaction, { isLoading }] = useCreateTransactionMutation();
  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: accountsData } = useGetAccountsQuery();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<CreateTransactionFormValues>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      type: "expense",
      // Default date to today in YYYY-MM-DD format for the HTML date input
      date: new Date().toISOString().slice(0, 10),
    },
  });

  const selectedType = watch("type");

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: CreateTransactionFormValues) => {
    try {
      // Transactions are sent as multipart/form-data because of the optional receipt file.
      // We build FormData manually from the form values here — the API service
      // passes it directly to fetch(), which sets the correct Content-Type with boundary.
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("amount", String(values.amount));
      formData.append("type", values.type);
      formData.append("category", values.category);
      formData.append("account", values.account);
      if (values.date) formData.append("date", values.date);
      if (values.notes?.trim()) formData.append("notes", values.notes.trim());

      // FileList comes from the file input — grab the first file if present
      const fileList = values.receipt as FileList | undefined;
      if (fileList?.[0]) formData.append("receipt", fileList[0]);

      await createTransaction(formData).unwrap();
      handleClose();
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Failed to create transaction.";
      setError("root", { message });
    }
  };

  // Filter categories by the selected type so only relevant ones appear in the dropdown
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
        <h2 className="mb-5 text-lg font-semibold text-white">New Transaction</h2>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          {/* Type toggle — income / expense */}
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

          {/* Title + amount (side by side) */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Title</label>
              <input
                type="text"
                placeholder="e.g. Grocery run"
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
                placeholder="0.00"
                disabled={isLoading}
                className={inputClass(!!errors.amount)}
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p role="alert" className="text-xs text-red-400">{errors.amount.message}</p>
              )}
            </div>
          </div>

          {/* Category + Account (side by side) */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Category</label>
              <select
                disabled={isLoading}
                className={selectClass(!!errors.category)}
                {...register("category")}
              >
                <option value="">Select category</option>
                {filteredCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p role="alert" className="text-xs text-red-400">{errors.category.message}</p>
              )}
            </div>

            <div className="flex-1 space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Account</label>
              <select
                disabled={isLoading}
                className={selectClass(!!errors.account)}
                {...register("account")}
              >
                <option value="">Select account</option>
                {accountsData?.accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name}
                  </option>
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
            <input
              type="date"
              disabled={isLoading}
              className={inputClass(!!errors.date)}
              {...register("date")}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">
              Notes <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Any additional details…"
              disabled={isLoading}
              className={[
                inputClass(!!errors.notes),
                "resize-none",
              ].join(" ")}
              {...register("notes")}
            />
          </div>

          {/* Receipt file upload */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">
              Receipt <span className="font-normal text-gray-500">(optional, image only, max 5 MB)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              disabled={isLoading}
              className="w-full cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-400 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-1 file:text-xs file:font-medium file:text-white hover:file:bg-indigo-500 disabled:opacity-50"
              {...register("receipt")}
            />
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
              {isLoading ? "Saving…" : "Save transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
