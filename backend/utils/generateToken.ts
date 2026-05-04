import jwt, { SignOptions } from "jsonwebtoken";

// Generates a JWT access token for the given user ID
export const generateAccessToken = (userId: string): string => {
  const expiresIn = (process.env.JWT_ACCESS_EXPIRES_IN ||
    "24h") as SignOptions["expiresIn"];

  return jwt.sign(
    { id: userId, type: "access" },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn },
  );
};

export const generateRefreshToken = (userId: string): string => {
  const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ||
    "30d") as SignOptions["expiresIn"];

  return jwt.sign(
    { id: userId, type: "refresh" },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn },
  );
};
