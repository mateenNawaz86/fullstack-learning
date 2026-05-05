"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { useGetMeQuery, useLogoutMutation } from "@/src/services/authApi";
import { clearCredentials, setCredentials } from "@/src/store/authSlice";
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

  // On page refresh Redux is empty, so we call getMe to restore the session from
  // the HTTP-only cookie. Skipped when user is already in Redux (in-session nav).
  // baseQueryWithReauth transparently refreshes an expired access token, so this
  // only errors when both tokens are gone/invalid → redirect to login.
  const { data: meData, isLoading: isRestoring, isError: isSessionInvalid } =
    useGetMeQuery(undefined, { skip: !!user });

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
