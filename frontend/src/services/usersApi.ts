import { baseApi } from "./baseApi";
import type { GetUsersResponse } from "../types/user";

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<GetUsersResponse, void>({
      query: () => "/users",
      providesTags: ["Users"],
    }),
  }),
});

export const { useGetUsersQuery } = usersApi;
