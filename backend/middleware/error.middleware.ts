import { Request, Response, NextFunction } from "express";

// Extend Error to support a custom HTTP status code
export interface AppError extends Error {
  statusCode?: number;
}

// Global error handler — must be the last app.use() in index.ts
// Catches any error passed via next(err) from route handlers or middleware
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const status = err.statusCode || 500;

  // Hide internal error details in production to avoid leaking stack traces
  const message =
    process.env.NODE_ENV === "production" ? "Internal server error" : err.message;

  res.status(status).json({ success: false, message });
};
