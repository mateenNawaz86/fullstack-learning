"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
} from "../../services/financeApi";
import {
  createCategorySchema,
  type CreateCategoryFormValues,
} from "../../lib/validation/finance.schema";

const COLOR_PRESETS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#06b6d4",
];

export function CategoryManager() {
  const [isAdding, setIsAdding] = useState(false);

  const { data, isLoading } = useGetCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { color: "#6366f1" },
  });

  const selectedColor = watch("color");

  const onSubmit = async (values: CreateCategoryFormValues) => {
    try {
      await createCategory(values).unwrap();
      reset({ color: "#6366f1" });
      setIsAdding(false);
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Failed to create category.";
      setError("root", { message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id).unwrap();
    } catch (err) {
      alert(
        (err as { data?: { message?: string } })?.data?.message ??
          "Failed to delete category."
      );
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Categories</h2>
        <button
          onClick={() => setIsAdding((v) => !v)}
          className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-white/20 hover:text-white"
        >
          {isAdding ? "Cancel" : "+ Add"}
        </button>
      </div>

      {/* Add category inline form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mb-4 space-y-3 rounded-lg border border-white/10 bg-white/5 p-4"
        >
          <div className="flex gap-2">
            {/* Name */}
            <div className="flex-1 space-y-1">
              <input
                type="text"
                placeholder="Category name"
                disabled={isCreating}
                className={[
                  "w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-white",
                  "placeholder:text-gray-500 outline-none transition-colors disabled:opacity-50",
                  errors.name
                    ? "border-red-500/60"
                    : "border-white/10 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20",
                ].join(" ")}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-red-400">{errors.name.message}</p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-1">
              <select
                disabled={isCreating}
                className={[
                  "rounded-lg border bg-gray-900 px-3 py-2 text-sm text-white",
                  "outline-none transition-colors disabled:opacity-50",
                  errors.type
                    ? "border-red-500/60"
                    : "border-white/10 focus:border-indigo-500/60",
                ].join(" ")}
                {...register("type")}
              >
                <option value="">Type</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              {errors.type && (
                <p className="text-xs text-red-400">{errors.type.message}</p>
              )}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <p className="mb-1.5 text-xs text-gray-400">Color</p>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue("color", c)}
                  className={`size-6 cursor-pointer rounded-full transition-transform hover:scale-110 ${
                    selectedColor === c ? "ring-2 ring-white ring-offset-1 ring-offset-gray-900" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {errors.root && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {errors.root.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isCreating}
            className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {isCreating ? "Adding…" : "Add category"}
          </button>
        </form>
      )}

      {/* Category list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {data?.categories.map((cat) => (
            <li
              key={cat._id}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                {/* Color dot */}
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm text-white">{cat.name}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-400">
                  {cat.type}
                </span>
              </div>
              <button
                onClick={() => handleDelete(cat._id)}
                className="cursor-pointer text-xs text-red-400/60 transition-colors hover:text-red-400"
              >
                Remove
              </button>
            </li>
          ))}
          {data?.categories.length === 0 && (
            <p className="py-4 text-center text-xs text-gray-500">
              No categories yet.
            </p>
          )}
        </ul>
      )}
    </div>
  );
}
