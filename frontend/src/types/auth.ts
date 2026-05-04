// Centralised field-name registry — used in interfaces, zod schemas, and forms
// so a rename is a single-line change, not a grep-and-replace.

import { AuthField } from "../enums/enum";
export { AuthField };

export interface AuthUser {
  [AuthField.Id]: string;
  [AuthField.Name]: string;
  [AuthField.Email]: string;
}

export interface RegisterRequest {
  [AuthField.Name]: string;
  [AuthField.Email]: string;
  [AuthField.Password]: string;
}

export interface LoginRequest {
  [AuthField.Email]: string;
  [AuthField.Password]: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: AuthUser;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: AuthUser;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
}

export interface GetMeResponse {
  success: boolean;
  user: AuthUser;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}
