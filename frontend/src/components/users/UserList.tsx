"use client";

import { useSelector } from "react-redux";
import { useGetUsersQuery } from "../../services/usersApi";
import { UserField } from "../../types/user";
import { AuthField } from "../../types/auth";
import type { RootState } from "../../store/store";
import { SekeletonCard } from "./skeleton-card";
import { UserCard } from "./UserCard";

export function UserList() {
  const { data, isLoading, isError, error, refetch } = useGetUsersQuery();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  console.log(data, "data");

  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Users</h1>
            {data && (
              <p className="mt-1 text-sm text-gray-400">
                {data.count} {data.count === 1 ? "user" : "users"} total
              </p>
            )}
          </div>

          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {isLoading && (
          <div className="space-y-3" aria-label="Loading users">
            {Array.from({ length: 4 }).map((_, i) => (
              <SekeletonCard key={i} />
            ))}
          </div>
        )}

        {isError && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400"
          >
            {(error as { data?: { message?: string } })?.data?.message ??
              "Failed to load users. Please try again."}
          </div>
        )}

        {!isLoading && !isError && data?.users.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-500">
            No users found.
          </p>
        )}

        {!isLoading && !isError && data && data.users?.length > 0 && (
          <ul className="space-y-3">
            {data?.users
              // Filter out the current user from the list using the same logic as the backend ($ne operator)
              .filter(
                (user) => user[UserField.Id] !== currentUser?.[AuthField.Id],
              )
              ?.map((user) => (
                <li key={user[UserField.Id]}>
                  <UserCard user={user} />
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
