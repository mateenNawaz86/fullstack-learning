import { Request, Response } from "express";
import { User } from "../models/user.models";

// Returns all users except the currently authenticated one
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
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
