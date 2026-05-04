import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

export type BaseQueryExtraOptions = {
  skipReauth?: boolean;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "include", // send HTTP-only cookies (accessToken, refreshToken)
});

// Prevents multiple concurrent 401s from each triggering their own refresh.
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(
  api: Parameters<BaseQueryFn>[1],
  extraOptions: BaseQueryExtraOptions,
): Promise<boolean> {
  // This part checks if refresh is already running and if so, waits for it instead of starting a new one.
  if (refreshPromise) return refreshPromise;

  // If not, start a new refresh and store the promise so other calls can wait for it.
  refreshPromise = (async () => {
    const result = await rawBaseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions,
    );
    return !result.error;
  })();

  // Wait for the refresh to complete, then clear the promise so future 401s can trigger new refreshes.
  const ok = await refreshPromise;
  refreshPromise = null;
  return ok;
}

// On 401, attempt one silent token refresh then retry the original request.
// Endpoints that set extraOptions.skipReauth (login, register) bypass this
// so wrong-credential 401s are never mistaken for expired-token 401s.
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  BaseQueryExtraOptions
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  // Only attempt refresh if we got a 401, and we're not already trying to refresh, and this endpoint isn't opt-out from reauth.
  if (result.error?.status === 401 && !extraOptions?.skipReauth) {
    const refreshed = await tryRefresh(api, extraOptions);
    if (refreshed) {
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Users", "Auth"],
  endpoints: () => ({}),
});
