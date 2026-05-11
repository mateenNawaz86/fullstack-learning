import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response } from "express";
import { User } from "../models/user.models";
import { PasswordResetToken } from "../models/password-reset-token.model";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken";
import { accessCookieOptions, refreshCookieOptions } from "../utils/cookies";
import { sendEmail } from "../utils/sendEmail";

// Shape of the decoded JWT payload produced by generateRefreshToken
interface JwtRefreshPayload extends JwtPayload {
  id: string;
  type: string;
}

// Register a new user
export const registerUserController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, password } = req.body as {
      name: string;
      email: string;
      password: string;
    };

    if (!name || !email || !password) {
      res
        .status(400)
        .json({ success: false, message: "All Fields are required!" });
      return;
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(400).json({ success: false, message: "User already exists" });
      return;
    }

    // Password is hashed automatically via the pre-save hook in the model
    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Login user — issues access + refresh tokens as HTTP-only cookies
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
      return;
    }

    // Explicitly select password and refreshToken (both have select: false in schema)
    const user = await User.findOne({ email }).select(
      "+password +refreshToken",
    );

    if (!user) {
      res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
      return;
    }

    // Use the model's comparePassword method instead of calling bcrypt directly
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
      return;
    }

    // Generate both tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Persist refresh token in DB — validated on every /refresh request
    user.refreshToken = refreshToken;
    await user.save();

    // Tokens are sent as HTTP-only cookies — not exposed in the response body
    res.cookie("accessToken", accessToken, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Issue a new access token using the stored refresh token cookie
export const refreshAccessToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;

    if (!token) {
      res
        .status(401)
        .json({ success: false, message: "No refresh token provided" });
      return;
    }

    // Verify the refresh token signature and expiry
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET as string,
    ) as JwtRefreshPayload;

    // Reject access tokens mistakenly sent to this endpoint
    if (decoded.type !== "refresh") {
      res.status(401).json({ success: false, message: "Invalid token type" });
      return;
    }

    // Compare against stored token — detects reuse after logout
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== token) {
      res
        .status(401)
        .json({ success: false, message: "Invalid or expired refresh token" });
      return;
    }

    // Issue a fresh access token and deliver it via cookie
    const newAccessToken = generateAccessToken(user._id.toString());
    res.cookie("accessToken", newAccessToken, accessCookieOptions);

    res.status(200).json({ success: true, message: "Access token refreshed" });
  } catch (error) {
    res
      .status(401)
      .json({ success: false, message: "Invalid or expired refresh token" });
  }
};

// Returns the currently authenticated user (used to restore session on page refresh)
export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  res.status(200).json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
};

// Logout — clears tokens from DB and removes cookies
export const logoutUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined;

    if (refreshToken) {
      // Invalidate the stored refresh token so it cannot be reused after logout
      const user = await User.findOne({ refreshToken }).select("+refreshToken");
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    }

    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Pre-flight check for the reset password page — tells the client why a token is unusable
// without consuming it. Returns one of three reasons so the UI can show a precise message.
export const validateResetToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { token } = req.params as { token: string };

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const record = await PasswordResetToken.findOne({ token: hashedToken });

  if (!record) {
    res.status(400).json({ success: false, reason: "invalid" });
    return;
  }

  if (record.usedAt) {
    res.status(400).json({ success: false, reason: "used" });
    return;
  }

  if (record.expiresAt < new Date()) {
    res.status(400).json({ success: false, reason: "expired" });
    return;
  }

  res.status(200).json({ success: true });
};

// Step 1 of password reset — generates a one-time token and emails a reset link to the user
export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body as { email: string };

    if (!email) {
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }

    // Find the user by email — if not found, we still return 200 to prevent email enumeration attacks
    const user = await User.findOne({ email });

    // Always return 200 whether or not the email exists in our DB.
    // Returning 404 would let an attacker discover which emails are registered.
    if (!user) {
      res.status(200).json({
        success: true,
        message: "If that email is registered, a reset link has been sent",
      });
      return;
    }

    // Generate a cryptographically random 32-byte token (= 64 hex chars).
    // This plaintext value goes into the email link and is NEVER stored in the DB.
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Store only the SHA-256 hash — if the DB is breached the hashes are useless alone.
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    await PasswordResetToken.create({
      userId: user._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // The link the user clicks — contains the RAW (unhashed) token
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset</h2>
            <p>Hi ${user.name},</p>
            <p>You requested a password reset. Click the button below to set a new password.</p>
            <p>
              <a href="${resetUrl}"
                 style="display:inline-block; padding:12px 24px; background:#4F46E5;
                        color:#fff; text-decoration:none; border-radius:6px;">
                Reset Password
              </a>
            </p>
            <p style="color:#888; font-size:13px;">
              This link expires in <strong>10 minutes</strong>.<br/>
              If you did not request a password reset, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      // If the email fails to send, clear the token we just saved so the user
      // can try again — otherwise the token sits in the DB unused for 10 minutes
      await PasswordResetToken.deleteOne({ token: hashedToken });

      res.status(500).json({
        success: false,
        message: "Failed to send reset email. Please try again.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "If that email is registered, a reset link has been sent",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Step 2 of password reset — validates the token from the URL and sets the new password
export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // The raw token comes from the URL param — same value that was emailed to the user
    const { token } = req.params as { token: string };
    const { password } = req.body as { password: string };

    if (!password) {
      res
        .status(400)
        .json({ success: false, message: "New password is required" });
      return;
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find a token record that matches, is still within its expiry, and has not been used yet
    const resetRecord = await PasswordResetToken.findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() },
      usedAt: { $exists: false },
    });

    if (!resetRecord) {
      res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
      return;
    }

    // Find the user associated with the reset record
    const user = await User.findById(resetRecord.userId).select("+password");

    if (!user) {
      res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
      return;
    }

    // Set the new password — the pre-save hook in user.models.ts will hash it automatically
    user.password = password;
    await user.save();

    // Stamp usedAt to preserve the audit record while making the token one-time-use
    resetRecord.usedAt = new Date();
    await resetRecord.save();

    res.status(200).json({
      success: true,
      message: "Password has been reset. You can now log in.",
    });
  } catch (error) {
    if ((error as Error).name === "ValidationError") {
      res.status(422).json({
        success: false,
        message: "Validation failed",
        error: (error as Error).message,
      });
      return;
    }
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
