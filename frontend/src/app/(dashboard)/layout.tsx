"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AuthField } from "@/src/enums/enum";
import { baseApi } from "@/src/services/baseApi";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { useGetMeQuery, useLogoutMutation } from "@/src/services/authApi";
import { clearCredentials, setCredentials } from "@/src/store/authSlice";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  // On page refresh Redux is empty, so we call getMe to restore the session from
  // the HTTP-only cookie. Skipped when user is already in Redux (in-session nav).
  // baseQueryWithReauth transparently refreshes an expired access token, so this
  // only errors when both tokens are gone/invalid → redirect to login.
  const {
    data: meData,
    isLoading: isRestoring,
    isError: isSessionInvalid,
  } = useGetMeQuery(undefined, { skip: !!user });

  useEffect(() => {
    if (meData?.user) dispatch(setCredentials(meData.user));
  }, [meData, dispatch]);

  useEffect(() => {
    if (!isRestoring && isSessionInvalid) router.replace("/login");
  }, [isRestoring, isSessionInvalid, router]);

  const handleLogout = async () => {
    await logout();
    dispatch(clearCredentials());
    // Wipe the entire RTK Query cache so no stale query (getUsers, etc.)
    // attempts a refetch and races against the now-cleared auth cookies.
    dispatch(baseApi.util.resetApiState());
    router.push("/login");
  };

  if (isRestoring || !user) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-gray-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-white">Dashboard</span>

          <nav className="flex items-center gap-1">
            {[
              { href: "/users", label: "Users" },
              { href: "/todos", label: "Todos" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname === href
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              {user[AuthField.Role] === "admin" && (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                  admin
                </span>
              )}
              <span className="text-xs text-gray-400">
                {user[AuthField.Email]}
              </span>
            </div>

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
