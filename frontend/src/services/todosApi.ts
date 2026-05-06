import { baseApi } from "./baseApi";
import type {
  GetTodosResponse,
  CreateTodoRequest,
  CreateTodoResponse,
  UpdateTodoRequest,
  UpdateTodoResponse,
  DeleteTodoResponse,
} from "../types/todo";

export const todosApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTodos: builder.query<GetTodosResponse, void>({
      query: () => "/todos",
      providesTags: ["Todos"],
    }),

    createTodo: builder.mutation<CreateTodoResponse, CreateTodoRequest>({
      query: (body) => ({
        url: "/todos",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Todos"],
    }),

    // Sends only the fields that changed
    updateTodo: builder.mutation<
      UpdateTodoResponse,
      { id: string } & UpdateTodoRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/todos/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Todos"],
    }),

    deleteTodo: builder.mutation<DeleteTodoResponse, string>({
      query: (id) => ({
        url: `/todos/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Todos"],
    }),
  }),
});

export const {
  useGetTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
} = todosApi;
