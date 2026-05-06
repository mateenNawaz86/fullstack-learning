import { baseApi } from "./baseApi";
import type {
  GetUsersResponse,
  UpdateUserRequest,
  UpdateUserResponse,
} from "../types/user";

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<GetUsersResponse, void>({
      query: () => "/users",
      providesTags: ["Users"],
    }),

    // Sends only the fields that changed; invalidates the Users cache on success
    // so the list re-fetches and reflects the updated name/email immediately.
    updateUser: builder.mutation<
      UpdateUserResponse,
      { id: string } & UpdateUserRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const { useGetUsersQuery, useUpdateUserMutation } = usersApi;
