import mongoose from "mongoose";
import { Request, Response } from "express";
import { Todo } from "../models/todo.model";

// Returns all todos belonging to the currently authenticated user, newest first
export const getTodos = async (req: Request, res: Response): Promise<void> => {
  try {
    const todos = await Todo.find({ user: req.user!._id })
      .select("-__v")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: todos?.length, todos });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch todos",
      error: (error as Error).message,
    });
  }
};

// Creates a new todo owned by the current user
export const createTodo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { title, description } = req.body as {
      title: string;
      description?: string;
    };

    const todo = await Todo.create({
      title,
      description,
      user: req.user!._id,
    });

    res.status(201).json({ success: true, todo });
  } catch (error) {
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
      message: "Failed to create todo",
      error: (error as Error).message,
    });
  }
};

// Updates title, description, and/or completed for a todo owned by the current user
export const updateTodo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    // Validate ID format before querying the database to prevent unnecessary queries and potential errors
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid todo ID" });
      return;
    }

    // Scoping by user ensures a user can never modify someone else's todo
    const todo = await Todo.findOne({ _id: id, user: req.user!._id });

    if (!todo) {
      res.status(404).json({ success: false, message: "Todo not found" });
      return;
    }

    // Only update fields that were provided in the request body
    const { title, description, completed } = req.body as {
      title?: string;
      description?: string;
      completed?: boolean;
    };

    if (title !== undefined) todo.title = title;
    if (description !== undefined) todo.description = description;
    if (completed !== undefined) todo.completed = completed;

    await todo.save();

    res.status(200).json({ success: true, todo });
  } catch (error) {
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
      message: "Failed to update todo",
      error: (error as Error).message,
    });
  }
};

// Deletes a todo owned by the current user
export const deleteTodo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid todo ID" });
      return;
    }

    // findOneAndDelete with user filter prevents deleting other users' todos
    const todo = await Todo.findOneAndDelete({ _id: id, user: req.user!._id });

    if (!todo) {
      res.status(404).json({ success: false, message: "Todo not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Todo deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete todo",
      error: (error as Error).message,
    });
  }
};
