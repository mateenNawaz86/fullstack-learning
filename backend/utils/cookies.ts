import { CookieOptions } from "express";

const isProduction = process.env.NODE_ENV === "production";

export const accessCookieOptions: CookieOptions = {
  httpOnly: true,           // not accessible via document.cookie (XSS protection)
  secure: isProduction,     // HTTPS-only in production
  sameSite: "lax",          // CSRF protection while supporting normal navigation
  path: "/",
  maxAge: 15 * 60 * 1000,  // 15 minutes
};

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};
