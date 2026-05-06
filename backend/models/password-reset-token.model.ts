import mongoose, { Schema } from "mongoose";

export interface IPasswordResetToken {
  userId: mongoose.Types.ObjectId;
  token: string; // SHA-256 hash of the raw token — raw value is only ever in the email link
  expiresAt: Date;
  usedAt?: Date; // set when the token is consumed — undefined means still unused
  createdAt: Date;
  updatedAt: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: undefined,
    },
  },
  { timestamps: true },
);

export const PasswordResetToken = mongoose.model<IPasswordResetToken>(
  "PasswordResetToken",
  passwordResetTokenSchema,
);
