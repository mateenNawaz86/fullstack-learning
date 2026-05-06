"use client";

import { useState } from "react";
import { useUpdateTodoMutation, useDeleteTodoMutation } from "../../services/todosApi";
import { EditTodoModal } from "./EditTodoModal";
import type { Todo } from "../../types/todo";

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [updateTodo, { isLoading: isToggling }] = useUpdateTodoMutation();
  const [deleteTodo, { isLoading: isDeleting }] = useDeleteTodoMutation();

  const handleToggleComplete = async () => {
    await updateTodo({ id: todo._id, completed: !todo.completed });
  };

  const handleDelete = async () => {
    await deleteTodo(todo._id);
  };

  return (
    <>
      <div
        className={`flex items-start gap-4 rounded-lg border px-5 py-4 transition-colors ${
          todo.completed
            ? "border-white/5 bg-white/2 opacity-60"
            : "border-white/10 bg-white/5 hover:bg-white/10"
        }`}
      >
        {/* Completed toggle checkbox */}
        <button
          onClick={handleToggleComplete}
          disabled={isToggling || isDeleting}
          aria-label={todo.completed ? "Mark as incomplete" : "Mark as complete"}
          className={`mt-0.5 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors disabled:cursor-not-allowed ${
            todo.completed
              ? "border-indigo-500 bg-indigo-500 text-white"
              : "border-white/30 bg-transparent hover:border-indigo-400"
          }`}
        >
          {todo.completed && (
            <svg
              className="size-3"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 6l3 3 5-5" />
            </svg>
          )}
        </button>

        {/* Title and description */}
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium ${
              todo.completed ? "text-gray-500 line-through" : "text-white"
            }`}
          >
            {todo.title}
          </p>
          {todo.description && (
            <p className="mt-0.5 text-xs text-gray-500">{todo.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            disabled={isDeleting}
            className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Edit
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting || isToggling}
            className="cursor-pointer rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:border-red-500/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? "…" : "Delete"}
          </button>
        </div>
      </div>

      <EditTodoModal
        todo={todo}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
      />
    </>
  );
}
