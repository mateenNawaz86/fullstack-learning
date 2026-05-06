import express from "express";
import rateLimit from "express-rate-limit";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUserController,
  getMe,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

// Limit auth endpoints to 5 requests per IP per 15-minute window (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true, // Return rate-limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
});

router.post("/register", authLimiter, registerUserController);
router.post("/login", authLimiter, loginUser);
router.post("/logout", logoutUser);
router.post("/refresh", refreshAccessToken);
router.get("/me", protect, getMe);

// Rate-limited so an attacker cannot spam password reset emails or brute-force tokens
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPassword);

export default router;
