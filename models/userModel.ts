import mongoose, { Document, Schema, Model, model, models } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

// Define the IUser interface if not already defined
export interface IUser extends Document {
  username: string;
  profileImage?: string;
  email: string;
  isOauth?: boolean;
  password?: string;
  linkedin?: string;
  github?: string;
  bio?: string;
  about?: string;
  location?: string;
  techStacks?: string[];
  connections?: string[];
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    profileImage: {
      type: String,
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
    linkedin: {
      type: String,
      trim: true,
      validate: {
        validator: (value: string) =>
          !value || validator.isURL(value, { require_protocol: true }),
        message: "Please provide a valid LinkedIn URL",
      },
    },
    github: {
      type: String,
      trim: true,
      validate: {
        validator: (value: string) =>
          !value || validator.isURL(value, { require_protocol: true }),
        message: "Please provide a valid GitHub URL",
      },
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    about: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    techStacks: {
      type: [String],
      default: [],
    },
    connections: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
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