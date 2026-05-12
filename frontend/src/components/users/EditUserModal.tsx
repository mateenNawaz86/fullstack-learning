"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateUserSchema,
  type UpdateUserFormValues,
} from "../../lib/validation/auth.schema";
import { useUpdateUserMutation, useUploadAvatarMutation } from "../../services/usersApi";
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
  const [uploadAvatar, { isLoading: isUploadingAvatar }] = useUploadAvatarMutation();

  // Local preview so the avatar updates instantly without waiting for the cache refetch
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setAvatarPreview(null);
      setAvatarError(null);
    }
  }, [isOpen, user, reset]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    // Show a local preview immediately — no waiting for the Cloudinary round-trip
    setAvatarPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      await uploadAvatar({ id: user[UserField.Id], formData }).unwrap();
    } catch {
      setAvatarPreview(null);
      setAvatarError("Failed to upload avatar. Please try again.");
    }
  };

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

        {/* ── Avatar upload — completely independent of the text form below ── */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="relative">
            {avatarPreview || user[UserField.AvatarUrl] ? (
              <img
                src={avatarPreview ?? user[UserField.AvatarUrl]}
                alt={user[UserField.Name]}
                className="size-20 rounded-full object-cover ring-2 ring-white/10"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full bg-indigo-500/20 text-2xl font-semibold text-indigo-300 ring-2 ring-white/10">
                {user[UserField.Name].charAt(0).toUpperCase()}
              </div>
            )}

            {isUploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={isUploadingAvatar}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="cursor-pointer text-xs font-medium text-indigo-400 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploadingAvatar ? "Uploading…" : "Change avatar"}
            </button>
            <span className="text-xs text-gray-500">JPG, PNG, WebP · max 5 MB</span>
          </div>

          {avatarError && (
            <p className="text-xs text-red-400">{avatarError}</p>
          )}
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
