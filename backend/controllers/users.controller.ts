import { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "../models/user.models";
import { uploadBuffer, deleteFile } from "../lib/cloudinary";

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

// ─── PATCH /users/:id/avatar ───────────────────────────────────────────────────
// Separate endpoint so profile text updates stay as plain JSON and only the
// avatar route needs multipart/form-data and the Multer middleware.
export const uploadAvatar = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid user ID" });
      return;
    }

    const isOwner = req.user!._id.toString() === id;
    const isAdmin = req.user!.role === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: "Not authorized to update this user" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: "No image file provided" });
      return;
    }

    // Select avatarPublicId explicitly — it has select:false on the schema
    const user = await User.findById(id).select("+avatarPublicId");

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Delete the old avatar from Cloudinary before uploading the new one
    // to avoid accumulating orphaned files in storage.
    if (user.avatarPublicId) {
      await deleteFile(user.avatarPublicId);
    }

    const { url, publicId } = await uploadBuffer(req.file.buffer, "finance/avatars");
    user.avatarUrl = url;
    user.avatarPublicId = publicId;
    await user.save();

    // Re-fetch to return a clean document — avatarPublicId stays hidden from the client
    const updatedUser = await User.findById(id).select("-password -__v");

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload avatar",
      error: (error as Error).message,
    });
  }
};
