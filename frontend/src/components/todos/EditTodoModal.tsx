"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateTodoSchema,
  type UpdateTodoFormValues,
} from "../../lib/validation/todo.schema";
import { useUpdateTodoMutation } from "../../services/todosApi";
import type { Todo } from "../../types/todo";

interface EditTodoModalProps {
  todo: Todo;
  isOpen: boolean;
  onClose: () => void;
}

export function EditTodoModal({ todo, isOpen, onClose }: EditTodoModalProps) {
  const [updateTodo, { isLoading }] = useUpdateTodoMutation();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UpdateTodoFormValues>({
    resolver: zodResolver(updateTodoSchema),
    defaultValues: {
      title: todo.title,
      description: todo.description ?? "",
    },
  });

  // Re-populate the form with fresh data each time the modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        title: todo.title,
        description: todo.description ?? "",
      });
    }
  }, [isOpen, todo, reset]);

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: UpdateTodoFormValues) => {
    try {
      await updateTodo({
        id: todo._id,
        title: values.title,
        // Send undefined rather than empty string so the backend clears the field
        description: values.description?.trim() || undefined,
      }).unwrap();
      handleClose();
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Failed to update todo. Please try again.";
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
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-white">Edit Todo</h2>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="edit-title"
              className="block text-sm font-medium text-gray-300"
            >
              Title
            </label>
            <input
              id="edit-title"
              type="text"
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
              htmlFor="edit-description"
              className="block text-sm font-medium text-gray-300"
            >
              Description{" "}
              <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <textarea
              id="edit-description"
              rows={4}
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

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 cursor-pointer rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 cursor-pointer rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
