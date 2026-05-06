"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateUserSchema,
  type UpdateUserFormValues,
} from "../../lib/validation/auth.schema";
import { useUpdateUserMutation } from "../../services/usersApi";
import { FormField } from "../../features/auth/components/FormField";
import { type User, UserField } from "../../types/user";
import { AuthField } from "../../enums/enum";

interface EditUserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function EditUserModal({ user, isOpen, onClose }: EditUserModalProps) {
  const [updateUser, { isLoading }] = useUpdateUserMutation();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      [AuthField.Name]: user[UserField.Name],
      [AuthField.Email]: user[UserField.Email],
      [AuthField.Password]: "",
    },
  });

  // Re-populate the form with fresh data each time the modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        [AuthField.Name]: user[UserField.Name],
        [AuthField.Email]: user[UserField.Email],
        [AuthField.Password]: "",
      });
    }
  }, [isOpen, user, reset]);

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: UpdateUserFormValues) => {
    try {
      const payload: {
        name: string;
        email: string;
        password?: string;
      } = {
        name: values[AuthField.Name],
        email: values[AuthField.Email],
      };

      // Only send password if the user actually typed one
      if (values[AuthField.Password]) {
        payload.password = values[AuthField.Password];
      }

      await updateUser({ id: user[UserField.Id], ...payload }).unwrap();
      handleClose();
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Failed to update user. Please try again.";
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
          <h2 className="text-lg font-semibold text-white">Edit User</h2>
          <p className="mt-1 text-sm text-gray-400">
            Updating profile for{" "}
            <span className="text-gray-200">{user[UserField.Name]}</span>
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          <FormField
            id={AuthField.Name}
            label="Name"
            type="text"
            placeholder="Full name"
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
            label="New password"
            type="password"
            placeholder="Leave blank to keep current password"
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
