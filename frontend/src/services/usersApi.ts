import { baseApi } from "./baseApi";
import type {
  GetUsersResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  UploadAvatarResponse,
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

    // Separate avatar-only mutation — sends FormData to PATCH /users/:id/avatar.
    // Kept separate from updateUser so profile text updates stay plain JSON and
    // the avatar can be changed independently without touching the text form.
    uploadAvatar: builder.mutation<UploadAvatarResponse, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/users/${id}/avatar`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useUpdateUserMutation,
  useUploadAvatarMutation,
} = usersApi;
