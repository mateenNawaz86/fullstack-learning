import { UserField } from "../enums/enum";
export { UserField };

export type UserRole = "user" | "admin";

export interface User {
  [UserField.Id]: string;
  [UserField.Name]: string;
  [UserField.Email]: string;
  [UserField.Role]: UserRole;
  [UserField.AvatarUrl]?: string;
  [UserField.CreatedAt]: string;
  [UserField.UpdatedAt]: string;
}

export interface GetUsersResponse {
  success: boolean;
  count: number;
  users: User[];
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
}

export interface UpdateUserResponse {
  success: boolean;
  user: User;
}

export interface UploadAvatarResponse {
  success: boolean;
  user: User;
}
