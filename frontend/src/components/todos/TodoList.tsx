"use client";

import { useGetTodosQuery } from "../../services/todosApi";
import { CreateTodoForm } from "./CreateTodoForm";
import { TodoItem } from "./TodoItem";

export function TodoList() {
  const { data, isLoading, isError, error } = useGetTodosQuery();

  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">My Todos</h1>
          {data && (
            <p className="mt-1 text-sm text-gray-400">
              {data.count} {data.count === 1 ? "todo" : "todos"} total
            </p>
          )}
        </div>

        <CreateTodoForm />

        {isLoading && (
          <div className="space-y-3" aria-label="Loading todos">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg border border-white/10 bg-white/5"
              />
            ))}
          </div>
        )}

        {isError && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400"
          >
            {(error as { data?: { message?: string } })?.data?.message ??
              "Failed to load todos. Please try again."}
          </div>
        )}

        {!isLoading && !isError && data?.todos.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-500">
            No todos yet. Add one above!
          </p>
        )}

        {!isLoading && !isError && data && data.todos.length > 0 && (
          <ul className="space-y-3">
            {data.todos.map((todo) => (
              <li key={todo._id}>
                <TodoItem todo={todo} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
