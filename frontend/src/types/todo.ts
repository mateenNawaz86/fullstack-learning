export interface Todo {
  _id: string;
  title: string;
  description?: string;
  completed: boolean;
  user: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetTodosResponse {
  success: boolean;
  count: number;
  todos: Todo[];
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
}

export interface CreateTodoResponse {
  success: boolean;
  todo: Todo;
}

// All fields optional — only provided fields are changed on the backend
export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  completed?: boolean;
}

export interface UpdateTodoResponse {
  success: boolean;
  todo: Todo;
}

export interface DeleteTodoResponse {
  success: boolean;
  message: string;
}
