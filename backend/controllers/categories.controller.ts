import mongoose from "mongoose";
import { Request, Response } from "express";
import { Category } from "../models/category.model";
import { Transaction } from "../models/transaction.model";

// Returns all categories for the logged-in user.
// Optional query param: ?type=income  or  ?type=expense
export const getCategories = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Start with a base filter scoped to the current user.
    // We build it as Record<string, unknown> so we can add properties dynamically.
    const filter: Record<string, unknown> = { user: req.user!._id };

    // Narrow by type if the client requested it
    if (req.query.type) filter.type = req.query.type;

    const categories = await Category.find(filter)
      .select("-__v") // exclude the internal Mongoose version field from the response
      .sort({ name: 1 }); // A-Z alphabetical

    res.status(200).json({ success: true, count: categories.length, categories });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: (error as Error).message,
    });
  }
};

// Creates a new category owned by the current user.
// Input has already been validated by validate(createCategorySchema) on the route.
export const createCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, type, color } = req.body as {
      name: string;
      type: "income" | "expense";
      color?: string;
    };

    const category = await Category.create({
      name,
      type,
      color,
      user: req.user!._id, // req.user is set by the protect middleware
    });

    res.status(201).json({ success: true, category });
  } catch (error) {
    // MongoDB error code 11000 = duplicate key violation.
    // This fires when the unique index (user + name + type) is hit.
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({
        success: false,
        message: "A category with this name and type already exists",
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: (error as Error).message,
    });
  }
};

// Updates name, type, and/or color for a category the current user owns.
export const updateCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    // Always validate the ID format before querying.
    // An invalid ObjectId string would throw a CastError inside Mongoose — checking
    // it here lets us return a clear 400 instead of a confusing 500.
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid category ID" });
      return;
    }

    // Scope the lookup to the current user — prevents user A from editing user B's category.
    const category = await Category.findOne({ _id: id, user: req.user!._id });

    if (!category) {
      res.status(404).json({ success: false, message: "Category not found" });
      return;
    }

    const { name, type, color } = req.body as {
      name?: string;
      type?: "income" | "expense";
      color?: string;
    };

    // Only update the fields the client actually sent.
    // Checking `!== undefined` (not just truthiness) allows clients to set color to ""
    // or name to a valid falsy value without it being ignored.
    if (name !== undefined) category.name = name;
    if (type !== undefined) category.type = type;
    if (color !== undefined) category.color = color;

    // .save() runs Mongoose validators and the pre-save hooks before writing to DB.
    // findByIdAndUpdate skips validators by default, so .save() is safer here.
    await category.save();

    res.status(200).json({ success: true, category });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({
        success: false,
        message: "A category with this name and type already exists",
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: (error as Error).message,
    });
  }
};

// Deletes a category — but only if no transactions reference it.
export const deleteCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid category ID" });
      return;
    }

    const category = await Category.findOne({ _id: id, user: req.user!._id });

    if (!category) {
      res.status(404).json({ success: false, message: "Category not found" });
      return;
    }

    // REFERENTIAL INTEGRITY CHECK
    // MongoDB has no foreign key constraints like SQL — we enforce this manually.
    // Transaction.exists() is cheaper than .findOne() because it stops as soon as it
    // finds one matching document instead of loading the full document.
    const inUse = await Transaction.exists({ category: id, user: req.user!._id });
    if (inUse) {
      res.status(409).json({
        success: false,
        message: "Cannot delete a category that has transactions. Reassign them first.",
      });
      return;
    }

    await category.deleteOne();

    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: (error as Error).message,
    });
  }
};
