import { baseApi } from "./baseApi";
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RefreshResponse,
  GetMeResponse,
} from "../types/auth";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
    }),

    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),

    // No invalidatesTags here — the caller dispatches resetEntireApiState()
    // after clearing credentials so the cache is wiped without triggering
    // refetches that would race against the cleared cookies.
    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),

    refresh: builder.mutation<RefreshResponse, void>({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
    }),

    // Validates the access token cookie and returns the current user.
    // Used by the dashboard layout to restore Redux state after a page refresh.
    // baseQueryWithReauth silently refreshes an expired access token before this
    // resolves, so callers never need to handle token expiry manually.
    getMe: builder.query<GetMeResponse, void>({
      query: () => "/auth/me",
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useRefreshMutation,
  useGetMeQuery,
} = authApi;
