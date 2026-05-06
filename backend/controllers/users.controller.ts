import { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "../models/user.models";

// Returns all users except the currently authenticated one
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // Exclude the current user from the results using $ne (not equal) operator
    const users = await User.find({ _id: { $ne: req.user!._id } }).select(
      "-password -__v",
    );

    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: (error as Error).message,
    });
  }
};

// Updates name, email, and/or password for a specific user.
// A user can only update their own profile; admins can update anyone.
export const updateUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Cast to string — Express params are always strings at runtime
    const id = req.params.id as string;

    // Reject malformed IDs before hitting the database
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid user ID" });
      return;
    }

    // Authorization: only the account owner or an admin may update the profile
    const isOwner = req.user!._id.toString() === id;
    const isAdmin = req.user!.role === "admin";

    if (!isOwner && !isAdmin) {
      res
        .status(403)
        .json({ success: false, message: "Not authorized to update this user" });
      return;
    }

    // Fetch the full document — password needed so the pre-save hook can hash a new one
    const user = await User.findById(id).select("+password");

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Only apply fields that were explicitly provided in the request body.
    // role and isVerified are intentionally excluded — those have dedicated flows.
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    // Assigning triggers the pre-save hook which re-hashes the new password
    if (password !== undefined) user.password = password;

    // save() runs Mongoose validators + the bcrypt pre-save hook
    await user.save();

    // Re-fetch to return the clean document without password or internal fields
    const updatedUser = await User.findById(id).select("-password -__v");

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    // MongoDB unique index violation — another account already uses that email
    if ((error as NodeJS.ErrnoException & { code?: number }).code === 11000) {
      res.status(409).json({ success: false, message: "Email is already in use" });
      return;
    }

    // Mongoose schema validation failure (e.g. name too short, invalid email format)
    if ((error as Error).name === "ValidationError") {
      res.status(422).json({
        success: false,
        message: "Validation failed",
        error: (error as Error).message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: (error as Error).message,
    });
  }
};
