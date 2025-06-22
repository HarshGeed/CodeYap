import mongoose, { Document, Schema, Model, model, models } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

// Define the IUser interface if not already defined
export interface IUser extends Document {
  username: string;
  email: string;
  isOauth?: boolean;
  password?: string;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value: string) => validator.isEmail(value),
        message: "Please provide a valid email",
      },
    },
    isOauth: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: function (this: { isOauth?: boolean }) {
        return !this.isOauth;
      },
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    // Remove await from this.password
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

const User: Model<IUser> = models?.User || model<IUser>("User", userSchema);
export default User;