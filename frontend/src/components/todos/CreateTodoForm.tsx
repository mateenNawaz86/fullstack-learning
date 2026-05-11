"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTodoSchema,
  type CreateTodoFormValues,
} from "../../lib/validation/todo.schema";
import { useCreateTodoMutation } from "../../services/todosApi";

export function CreateTodoForm() {
  const [createTodo, { isLoading }] = useCreateTodoMutation();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateTodoFormValues>({
    resolver: zodResolver(createTodoSchema),
    defaultValues: { title: "", description: "" },
  });

  const onSubmit = async (values: CreateTodoFormValues) => {
    try {
      const payload: CreateTodoFormValues = { title: values.title };
      // Only include description if it has content
      if (values.description?.trim()) {
        payload.description = values.description.trim();
      }

      await createTodo(payload).unwrap();
      reset();
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Failed to create todo. Please try again.";
      setError("root", { message });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-lg border border-white/10 bg-white/5 p-5"
    >
      <h2 className="mb-4 text-sm font-semibold text-white">New Todo</h2>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-300"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            placeholder="What needs to be done?"
            disabled={isLoading}
            aria-invalid={errors.title ? "true" : "false"}
            className={[
              "w-full rounded-lg border bg-white/5 px-4 py-2.5 text-sm text-white",
              "placeholder:text-gray-500 outline-none transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-50",
              errors.title
                ? "border-red-500/60 focus:ring-2 focus:ring-red-500/30"
                : "border-white/10 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20",
            ].join(" ")}
            {...register("title")}
          />
          {errors.title && (
            <p
              role="alert"
              className="flex items-center gap-1 text-xs text-red-400"
            >
              <span aria-hidden="true">✕</span>
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-300"
          >
            Description{" "}
            <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="Add a note…"
            disabled={isLoading}
            aria-invalid={errors.description ? "true" : "false"}
            className={[
              "w-full resize-none rounded-lg border bg-white/5 px-4 py-2.5 text-sm text-white",
              "placeholder:text-gray-500 outline-none transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-50",
              errors.description
                ? "border-red-500/60 focus:ring-2 focus:ring-red-500/30"
                : "border-white/10 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20",
            ].join(" ")}
            {...register("description")}
          />
          {errors.description && (
            <p
              role="alert"
              className="flex items-center gap-1 text-xs text-red-400"
            >
              <span aria-hidden="true">✕</span>
              {errors.description.message}
            </p>
          )}
        </div>

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
          className="cursor-pointer w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Adding…" : "Add todo"}
        </button>
      </div>
    </form>
  );
}
