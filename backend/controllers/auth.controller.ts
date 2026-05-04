import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response } from "express";
import { User } from "../models/user.models";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken";
import { accessCookieOptions, refreshCookieOptions } from "../utils/cookies";

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
      res.status(400).json({ success: false, message: "All Fields are required!" });
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
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

    // Explicitly select password and refreshToken (both have select: false in schema)
    const user = await User.findOne({ email }).select("+password +refreshToken");

    if (!user) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    // Use the model's comparePassword method instead of calling bcrypt directly
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
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
      user: { id: user._id, name: user.name, email: user.email },
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
      res.status(401).json({ success: false, message: "No refresh token provided" });
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
      res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
      return;
    }

    // Issue a fresh access token and deliver it via cookie
    const newAccessToken = generateAccessToken(user._id.toString());
    res.cookie("accessToken", newAccessToken, accessCookieOptions);

    res.status(200).json({ success: true, message: "Access token refreshed" });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }
};

// Returns the currently authenticated user (used to restore session on page refresh)
export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  res.status(200).json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email },
  });
};

// Logout — clears tokens from DB and removes cookies
export const logoutUser = async (req: Request, res: Response): Promise<void> => {
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
