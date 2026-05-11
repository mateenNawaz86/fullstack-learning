import mongoose, { Schema } from "mongoose";

export type AccountType = "cash" | "bank" | "credit_card" | "savings";

export interface IAccount {
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const accountSchema = new Schema<IAccount>(
  {
    name: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
      maxlength: [50, "Name must be at most 50 characters"],
    },
    type: {
      type: String,
      enum: ["cash", "bank", "credit_card", "savings"],
      required: [true, "Account type is required"],
    },
    // IMPORTANT: balance is never updated by the accounts controller directly.
    // It is managed exclusively via $inc in the transactions controller
    // (create → add/subtract, delete → reverse, update → reconcile).
    // This keeps the balance always in sync with the transaction history.
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "PKR",
      uppercase: true, // Mongoose transforms the stored value to uppercase
      trim: true,
      maxlength: [3, "Currency must be a 3-letter ISO code"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export const Account = mongoose.model<IAccount>("Account", accountSchema);
