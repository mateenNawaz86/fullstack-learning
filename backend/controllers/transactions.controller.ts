import mongoose from "mongoose";
import { Request, Response } from "express";
import { Transaction } from "../models/transaction.model";
import { Category } from "../models/category.model";
import { Account } from "../models/account.model";
import { uploadBuffer, deleteFile } from "../lib/cloudinary";

// ─── Helper ────────────────────────────────────────────────────────────────────

// Returns the signed amount to add to an account's balance for a transaction.
// income → positive (adds to balance)
// expense → negative (subtracts from balance)
const balanceDelta = (type: string, amount: number) =>
  type === "income" ? amount : -amount;

// ─── GET /transactions ─────────────────────────────────────────────────────────

export const getTransactions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // ── PAGINATION ────────────────────────────────────────────────────────────
    // page and limit come as query strings (?page=2&limit=20), so we parse them.
    // Math.max / Math.min clamp them to safe ranges — prevents page=0 or limit=999999.
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

    // skip = how many documents to jump over before returning results.
    // page 1 → skip 0, page 2 → skip 10, page 3 → skip 20, etc.
    const skip = (page - 1) * limit;

    // ── FILTERS ───────────────────────────────────────────────────────────────
    // Start with the user scope — a user can never see another user's transactions.
    const filter: Record<string, unknown> = { user: req.user!._id };

    // Each optional filter is only added when the query param is present.
    if (req.query.type) filter.type = req.query.type;

    // Validate ObjectId format before putting it in the query — an invalid string
    // would cause a Mongoose CastError instead of silently returning no results.
    if (req.query.category && mongoose.Types.ObjectId.isValid(req.query.category as string))
      filter.category = req.query.category;

    if (req.query.account && mongoose.Types.ObjectId.isValid(req.query.account as string))
      filter.account = req.query.account;

    // Date range filter using MongoDB's $gte (>=) and $lte (<=) operators.
    // Both are optional — you can pass just a startDate or just an endDate.
    if (req.query.startDate || req.query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (req.query.startDate) dateFilter.$gte = new Date(req.query.startDate as string);
      if (req.query.endDate) dateFilter.$lte = new Date(req.query.endDate as string);
      filter.date = dateFilter;
    }

    // ── TEXT SEARCH ───────────────────────────────────────────────────────────
    // $text searches across ALL fields that have a text index (title + notes on this model).
    // MongoDB's text index handles stemming, stop words, and case-insensitivity automatically.
    // This only works because we added: transactionSchema.index({ title: "text", notes: "text" })
    if (req.query.search) {
      filter.$text = { $search: req.query.search as string };
    }

    // ── PARALLEL QUERIES ──────────────────────────────────────────────────────
    // Promise.all runs both DB queries at the same time instead of one after the other.
    // Without it: query1 finishes → then query2 starts → total time = T1 + T2
    // With it: both run simultaneously → total time ≈ max(T1, T2)
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        // .populate() replaces the ObjectId with the actual document fields we specify.
        // "category" (ObjectId) becomes { name, type, color } from the Category collection.
        .populate("category", "name type color")
        .populate("account", "name type currency")
        .select("-__v -receiptPublicId") // hide internal fields from the API consumer
        .sort({ date: -1 })             // newest transactions first
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(filter), // total matching docs (for totalPages calculation)
    ]);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,         // total matching documents (across all pages)
        page,          // current page number
        limit,         // items per page
        totalPages: Math.ceil(total / limit), // Math.ceil because a partial page still counts
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: (error as Error).message,
    });
  }
};

// ─── POST /transactions ────────────────────────────────────────────────────────
// This route accepts multipart/form-data (because of the optional receipt file).
// Middleware order on the route: upload.single("receipt") → validate() → this controller.
// By the time we reach here: req.body has the text fields, req.file has the image (or undefined).

export const createTransaction = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { title, amount, type, category, account, date, notes } = req.body as {
      title: string;
      amount: number;      // already coerced from string by Zod
      type: "income" | "expense";
      category: string;    // ObjectId string
      account: string;     // ObjectId string
      date?: Date;         // already coerced from string by Zod
      notes?: string;
    };

    // Verify that the referenced category AND account both exist and belong to this user.
    // Running both DB queries in parallel with Promise.all halves the wait time.
    const [cat, acc] = await Promise.all([
      Category.findOne({ _id: category, user: req.user!._id }),
      Account.findOne({ _id: account, user: req.user!._id }),
    ]);

    if (!cat) {
      res.status(404).json({ success: false, message: "Category not found" });
      return;
    }
    if (!acc) {
      res.status(404).json({ success: false, message: "Account not found" });
      return;
    }

    // ── FILE UPLOAD ───────────────────────────────────────────────────────────
    // req.file is populated by Multer when the client sends a "receipt" file field.
    // uploadBuffer() streams req.file.buffer to Cloudinary and returns { url, publicId }.
    // We store both: url for displaying in the UI, publicId for deleting later.
    let receiptUrl: string | undefined;
    let receiptPublicId: string | undefined;
    if (req.file) {
      const uploaded = await uploadBuffer(req.file.buffer, "finance/receipts");
      receiptUrl = uploaded.url;
      receiptPublicId = uploaded.publicId;
    }

    const transaction = await Transaction.create({
      title,
      amount,
      type,
      category,
      account,
      date: date ?? new Date(),
      notes,
      receiptUrl,
      receiptPublicId,
      user: req.user!._id,
    });

    // ── BALANCE UPDATE ────────────────────────────────────────────────────────
    // $inc is a MongoDB atomic increment operator.
    // Atomic means: no race condition even if two requests come in simultaneously.
    // income  → balance += amount  (balanceDelta returns positive)
    // expense → balance -= amount  (balanceDelta returns negative)
    await Account.findByIdAndUpdate(account, {
      $inc: { balance: balanceDelta(type, amount) },
    });

    res.status(201).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create transaction",
      error: (error as Error).message,
    });
  }
};

// ─── PATCH /transactions/:id ───────────────────────────────────────────────────
// The tricky part here is BALANCE RECONCILIATION.
// Any of these fields might change: amount, type, account.
// Each change affects one or two account balances and must be handled precisely.

export const updateTransaction = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid transaction ID" });
      return;
    }

    const transaction = await Transaction.findOne({ _id: id, user: req.user!._id });

    if (!transaction) {
      res.status(404).json({ success: false, message: "Transaction not found" });
      return;
    }

    const { title, amount, type, category, account, date, notes } = req.body as {
      title?: string;
      amount?: number;
      type?: "income" | "expense";
      category?: string;
      account?: string;
      date?: Date;
      notes?: string;
    };

    // ── BALANCE RECONCILIATION ────────────────────────────────────────────────
    // We snapshot the old values BEFORE modifying the document.
    const oldAmount = transaction.amount;
    const oldType = transaction.type;
    const oldAccountId = transaction.account.toString();

    // Fall back to existing values if the client didn't send a new value.
    const newAmount = amount ?? oldAmount;
    const newType = type ?? oldType;
    const newAccountId = account ?? oldAccountId;

    // Validate new refs if provided
    if (category) {
      const cat = await Category.findOne({ _id: category, user: req.user!._id });
      if (!cat) {
        res.status(404).json({ success: false, message: "Category not found" });
        return;
      }
    }
    if (account && account !== oldAccountId) {
      const acc = await Account.findOne({ _id: account, user: req.user!._id });
      if (!acc) {
        res.status(404).json({ success: false, message: "Account not found" });
        return;
      }
    }

    const oldDelta = balanceDelta(oldType, oldAmount);
    const newDelta = balanceDelta(newType, newAmount);

    if (oldAccountId !== newAccountId) {
      // Transaction moved to a different account:
      // • Undo the old transaction's effect on the original account (reverse old delta).
      // • Apply the new transaction's effect on the new account.
      // Example: moved a 500 expense from "Cash" to "Bank"
      //   → Cash balance += 500  (was -500, now reversed)
      //   → Bank balance -= 500  (new expense applied)
      await Promise.all([
        Account.findByIdAndUpdate(oldAccountId, { $inc: { balance: -oldDelta } }),
        Account.findByIdAndUpdate(newAccountId, { $inc: { balance: newDelta } }),
      ]);
    } else {
      // Same account — only apply the NET difference to avoid double-counting.
      // Example: expense changed from 500 to 800 on "Cash"
      //   oldDelta = -500,  newDelta = -800,  diff = -300
      //   → Cash balance -= 300 (the extra deduction for the increased amount)
      const diff = newDelta - oldDelta;
      if (diff !== 0) {
        await Account.findByIdAndUpdate(oldAccountId, { $inc: { balance: diff } });
      }
    }

    // ── RECEIPT REPLACEMENT ───────────────────────────────────────────────────
    // If the client uploads a new receipt, delete the old one from Cloudinary first
    // to avoid accumulating orphaned files that waste storage.
    if (req.file) {
      if (transaction.receiptPublicId) {
        await deleteFile(transaction.receiptPublicId);
      }
      const uploaded = await uploadBuffer(req.file.buffer, "finance/receipts");
      transaction.receiptUrl = uploaded.url;
      transaction.receiptPublicId = uploaded.publicId;
    }

    if (title !== undefined) transaction.title = title;
    if (amount !== undefined) transaction.amount = amount;
    if (type !== undefined) transaction.type = type;
    if (category !== undefined) transaction.category = new mongoose.Types.ObjectId(category);
    if (account !== undefined) transaction.account = new mongoose.Types.ObjectId(account);
    if (date !== undefined) transaction.date = date;
    if (notes !== undefined) transaction.notes = notes;

    await transaction.save();

    res.status(200).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update transaction",
      error: (error as Error).message,
    });
  }
};

// ─── DELETE /transactions/:id ──────────────────────────────────────────────────

export const deleteTransaction = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid transaction ID" });
      return;
    }

    const transaction = await Transaction.findOne({ _id: id, user: req.user!._id });

    if (!transaction) {
      res.status(404).json({ success: false, message: "Transaction not found" });
      return;
    }

    // Reverse the exact balance change this transaction caused when it was created.
    // We negate balanceDelta: if it was +500 (income) we apply -500 to undo it.
    await Account.findByIdAndUpdate(transaction.account, {
      $inc: { balance: -balanceDelta(transaction.type, transaction.amount) },
    });

    // Clean up the receipt file from Cloudinary to keep storage usage tidy.
    if (transaction.receiptPublicId) {
      await deleteFile(transaction.receiptPublicId);
    }

    await transaction.deleteOne();

    res.status(200).json({ success: true, message: "Transaction deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
      error: (error as Error).message,
    });
  }
};

// ─── GET /summary ──────────────────────────────────────────────────────────────
// Uses MongoDB Aggregation Pipeline — the most powerful querying tool in MongoDB.
// Unlike .find(), a pipeline transforms documents step by step through stages.

export const getSummary = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!._id;

    // The $match stage filters documents — same as a .find() filter.
    // We build it before the pipeline and pass it as the first stage.
    const matchStage: Record<string, unknown> = { user: userId };

    // Parse ?month=2025-04 into a date range for the first and last day of the month.
    const monthParam = req.query.month as string | undefined;
    if (monthParam) {
      const [year, month] = monthParam.split("-").map(Number);
      if (year && month) {
        matchStage.date = {
          $gte: new Date(year, month - 1, 1),              // 1st day of month
          $lte: new Date(year, month, 0, 23, 59, 59, 999), // last day of month
        };
      }
    }

    if (req.query.account && mongoose.Types.ObjectId.isValid(req.query.account as string)) {
      matchStage.account = new mongoose.Types.ObjectId(req.query.account as string);
    }

    // ── PIPELINE 1: totals by type ────────────────────────────────────────────
    // Stages:
    // 1. $match  → keep only the current user's transactions in the chosen period
    // 2. $group  → group by "type" field, sum the amounts
    //
    // Result: [{ _id: "income", total: 50000, count: 5 }, { _id: "expense", total: 30000, count: 12 }]
    const totals = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$type",           // group key — one bucket per type
          total: { $sum: "$amount" }, // sum the amount field in each bucket
          count: { $sum: 1 },         // count documents in each bucket
        },
      },
    ]);

    // ── PIPELINE 2: breakdown by category ─────────────────────────────────────
    // Stages:
    // 1. $match  → same filter as above
    // 2. $group  → group by (category ObjectId + type), sum amounts
    // 3. $lookup → JOIN the categories collection to get name + color
    //              (like SQL: LEFT JOIN categories ON transaction.category = categories._id)
    // 4. $unwind → $lookup returns an array; $unwind flattens it to a single object
    // 5. $project → reshape the output to only include the fields we want
    // 6. $sort   → order by total descending (highest spending first)
    const byCategory = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { category: "$category", type: "$type" }, // group by category+type pair
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "categories",          // MongoDB collection name (lowercase plural of model name)
          localField: "_id.category",  // field in the current pipeline document
          foreignField: "_id",         // field in the "categories" collection to match on
          as: "categoryInfo",          // output array field name
        },
      },
      { $unwind: "$categoryInfo" }, // categoryInfo is an array of 1 — unwind to an object
      {
        $project: {
          _id: 0,                         // exclude _id from output
          category: "$categoryInfo.name", // rename for cleaner API response
          color: "$categoryInfo.color",
          type: "$_id.type",
          total: 1,                       // 1 = include this field
          count: 1,
        },
      },
      { $sort: { total: -1 } }, // highest total first
    ]);

    const income = totals.find((t) => t._id === "income")?.total ?? 0;
    const expense = totals.find((t) => t._id === "expense")?.total ?? 0;
    const incomeCount = totals.find((t) => t._id === "income")?.count ?? 0;
    const expenseCount = totals.find((t) => t._id === "expense")?.count ?? 0;

    res.status(200).json({
      success: true,
      data: {
        income,
        expense,
        net: income - expense,
        transactionCount: incomeCount + expenseCount,
        byCategory,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch summary",
      error: (error as Error).message,
    });
  }
};
