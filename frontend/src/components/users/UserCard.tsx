"use client";

import { useState } from "react";
import { UserField, type User } from "../../types/user";
import { EditUserModal } from "./EditUserModal";

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    // Fragment needed because the modal is rendered outside the card div
    <>
      <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 px-5 py-4 transition-colors hover:bg-white/10">
        <div
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-300"
        >
          {user[UserField.Name].charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {user[UserField.Name]}
          </p>
          <p className="truncate text-xs text-gray-400">
            {user[UserField.Email]}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            user[UserField.Role] === "admin"
              ? "bg-amber-500/20 text-amber-300"
              : "bg-gray-500/20 text-gray-400"
          }`}
        >
          {user[UserField.Role]}
        </span>

        <button
          onClick={() => setIsEditing(true)}
          className="cursor-pointer shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-white/20 hover:text-white"
        >
          Edit
        </button>
      </div>

      <EditUserModal
        user={user}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
      />
    </>
  );
}
