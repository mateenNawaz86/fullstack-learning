import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.models";

// Shape of the decoded JWT payload produced by generateAccessToken
interface JwtAccessPayload extends JwtPayload {
  id: string;
  type: string;
}

// Protects routes — verifies the access token from cookie or Authorization header
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Try Authorization: Bearer <token> header (useful for API clients / mobile)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // 2. Fall back to HTTP-only cookie set by the login endpoint
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken as string;
    }

    if (!token) {
      res
        .status(401)
        .json({ success: false, message: "Not authorized, no token provided" });
      return;
    }

    // Verify signature and expiry using the access secret
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string,
    ) as JwtAccessPayload;

    // Prevent refresh tokens from being used to access protected routes
    if (decoded.type !== "access") {
      res.status(401).json({ success: false, message: "Invalid token type" });
      return;
    }

    // Confirm the user still exists in DB (handles deleted-after-login edge case)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      res
        .status(401)
        .json({ success: false, message: "Not authorized, user not found" });
      return;
    }

    // Attach user to request so downstream handlers can use req.user
    req.user = user;
    next();
  } catch (error) {
    if ((error as Error).name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};
