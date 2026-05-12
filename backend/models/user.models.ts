import bcrypt from "bcrypt";
import mongoose, { Model, Schema } from "mongoose";

// Shape of the raw user document fields stored in MongoDB
export interface IUser {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  isVerified: boolean;
  refreshToken?: string;
  avatarUrl?: string;
  avatarPublicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Custom instance methods attached to each user document
export interface IUserMethods {
  comparePassword(enteredPassword: string): Promise<boolean>;
}

// Full document type — includes Mongoose document methods + our custom methods
// This is what req.user is typed as after the protect middleware
export type IUserDocument = mongoose.HydratedDocument<IUser, IUserMethods>;

// Model type — combines document interface with instance methods
type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // never returned in queries unless explicitly requested
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
      select: false,
    },
    // Stored to validate refresh token requests and invalidate on logout
    refreshToken: {
      type: String,
      select: false,
    },
    avatarUrl: { type: String },
    // Internal Cloudinary identifier — excluded from API responses, only used to delete old avatars
    avatarPublicId: { type: String, select: false },
  },
  { timestamps: true },
);

// Hash password before saving — skipped if password was not changed
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare a plaintext password against the stored hash
userSchema.methods.comparePassword = async function (
  enteredPassword: string,
): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model<IUser, UserModel>("User", userSchema);
