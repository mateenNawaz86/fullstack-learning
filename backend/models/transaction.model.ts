import mongoose, { Schema } from "mongoose";

export interface ITransaction {
  title: string;
  amount: number;
  type: "income" | "expense";
  category: mongoose.Types.ObjectId;
  account: mongoose.Types.ObjectId;
  date: Date;
  notes?: string;
  receiptUrl?: string;
  receiptPublicId?: string;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title must be at most 100 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: [true, "Type is required"],
    },
    // ObjectId references — Mongoose uses these with .populate() to join documents.
    // Unlike SQL JOINs, Mongoose populate runs a second query; it is NOT a DB-level join.
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "Account is required"],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes must be at most 500 characters"],
    },
    receiptUrl: { type: String },      // HTTPS URL returned by Cloudinary after upload
    receiptPublicId: { type: String }, // Cloudinary public_id — needed to delete the file later
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// INDEX 1 — Full-text search
// MongoDB's $text operator requires a text index to exist on the fields you want to search.
// This enables queries like: Transaction.find({ $text: { $search: "groceries" } })
// It searches across BOTH title and notes in one go.
transactionSchema.index({ title: "text", notes: "text" });

// INDEX 2 — Compound query index
// The most common query is "all transactions for user X, sorted newest first".
// Without this index MongoDB would scan every document in the collection.
// With it, MongoDB jumps straight to the matching user's docs already sorted by date.
transactionSchema.index({ user: 1, date: -1 });

export const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema,
);
