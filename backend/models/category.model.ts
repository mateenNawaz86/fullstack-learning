import mongoose, { Schema } from "mongoose";

export interface ICategory {
  name: string;
  type: "income" | "expense";
  color: string;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [50, "Name must be at most 50 characters"],
    },
    // Restricting to an enum at the schema level means MongoDB will reject
    // any value that isn't in the list, even if validation middleware is bypassed.
    type: {
      type: String,
      enum: ["income", "expense"],
      required: [true, "Category type is required"],
    },
    color: {
      type: String,
      default: "#6366f1", // a default purple so the frontend always has a color to render
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User", // tells Mongoose which model to use when .populate("user") is called
      required: true,
    },
  },
  { timestamps: true }, // auto-adds createdAt and updatedAt fields
);

// COMPOUND UNIQUE INDEX
// This prevents a user from creating two categories with the same name AND type.
// Without this, you could end up with two "Food" expense categories.
// The index is on (user, name, type) — not just (name, type) — so two different
// users CAN both have a "Food" expense category without conflicting.
categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

export const Category = mongoose.model<ICategory>("Category", categorySchema);
