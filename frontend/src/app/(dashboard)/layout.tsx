"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { useLogoutMutation } from "@/src/services/authApi";
import { clearCredentials } from "@/src/store/authSlice";
import { baseApi } from "@/src/services/baseApi";
import { AuthField } from "@/src/enums/enum";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  const handleLogout = async () => {
    await logout();
    dispatch(clearCredentials());
    // Wipe the entire RTK Query cache so no stale query (getUsers, etc.)
    // attempts a refetch and races against the now-cleared auth cookies.
    dispatch(baseApi.util.resetApiState());
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-gray-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-white">Dashboard</span>

          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-gray-400 sm:block">
              {user[AuthField.Email]}
            </span>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="cursor-pointer rounded-lg bg-red-600/20 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
