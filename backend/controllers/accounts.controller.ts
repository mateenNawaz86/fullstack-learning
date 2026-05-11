import mongoose from "mongoose";
import { Request, Response } from "express";
import { Account } from "../models/account.model";
import { Transaction } from "../models/transaction.model";

// Returns all accounts for the logged-in user, sorted A-Z by name.
export const getAccounts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const accounts = await Account.find({ user: req.user!._id })
      .select("-__v") // Exclude the version key added by Mongoose from the response
      .sort({ name: 1 });

    res.status(200).json({ success: true, count: accounts.length, accounts });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch accounts",
      error: (error as Error).message,
    });
  }
};

// Creates a new account (wallet/bank/etc.) for the current user.
// The initial balance can be set here to reflect an existing real-world balance.
// After creation, balance is only changed by the transactions controller.
export const createAccount = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, type, balance, currency } = req.body as {
      name: string;
      type: string;
      balance?: number;
      currency?: string;
    };

    const account = await Account.create({
      name,
      type,
      balance, // defaults to 0 if not provided (see model)
      currency, // defaults to "PKR" if not provided (see model)
      user: req.user!._id,
    });

    res.status(201).json({ success: true, account });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create account",
      error: (error as Error).message,
    });
  }
};

// Updates account metadata (name, type, currency).
// Balance is intentionally NOT updatable here — it is derived from transactions.
// Allowing direct balance edits would cause the balance to diverge from the transaction history.
export const updateAccount = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid account ID" });
      return;
    }

    const account = await Account.findOne({ _id: id, user: req.user!._id });

    if (!account) {
      res.status(404).json({ success: false, message: "Account not found" });
      return;
    }

    const { name, type, currency } = req.body as {
      name?: string;
      type?: string;
      currency?: string;
    };

    if (name !== undefined) account.name = name;
    if (type !== undefined) account.type = type as typeof account.type;
    if (currency !== undefined) account.currency = currency;

    await account.save();

    res.status(200).json({ success: true, account });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update account",
      error: (error as Error).message,
    });
  }
};

// Deletes an account — blocked if it still has transactions.
// Same referential integrity pattern as deleteCategory.
export const deleteAccount = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid account ID" });
      return;
    }

    const account = await Account.findOne({ _id: id, user: req.user!._id });

    if (!account) {
      res.status(404).json({ success: false, message: "Account not found" });
      return;
    }

    // Prevent orphaned transactions — if we deleted the account without deleting
    // its transactions, those transactions would reference a non-existent account.
    const inUse = await Transaction.exists({
      account: id,
      user: req.user!._id,
    });
    if (inUse) {
      res.status(409).json({
        success: false,
        message:
          "Cannot delete an account that has transactions. Delete them first.",
      });
      return;
    }

    await account.deleteOne();

    res.status(200).json({ success: true, message: "Account deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
      error: (error as Error).message,
    });
  }
};
