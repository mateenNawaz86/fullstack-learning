import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db";
import { User } from "../models/user.models";

async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Admin";

  if (!email || !password) {
    console.error("[Seed] ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email }).select("+password");

  // Check if an admin user already exists
  if (existing) {
    const needsUpdate = existing.role !== "admin" || !existing.isVerified;
    if (needsUpdate) {
      existing.role = "admin";
      existing.isVerified = true;
    }
    // Always sync the password so this script doubles as a password-reset tool
    existing.password = password;
    await existing.save();
    console.log(
      needsUpdate
        ? `[Seed] Promoted existing user to admin and reset password: ${email}`
        : `[Seed] Admin password updated: ${email}`,
    );
    await mongoose.disconnect();
    return;
  }

  await User.create({ name, email, password, role: "admin", isVerified: true });

  await mongoose.disconnect();
}

seedAdmin().catch((err: unknown) => {
  console.error("[Seed] Fatal error:", err);
  process.exit(1);
});
