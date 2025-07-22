import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGroup extends Document {
  name: string;
  members: mongoose.Types.ObjectId[];
  acceptedMembers: mongoose.Types.ObjectId[];
  admin: mongoose.Types.ObjectId;
  description?: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    acceptedMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: false,
      },
    ],
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Group: Model<IGroup> =
  mongoose.models.Group || mongoose.model<IGroup>("Group", groupSchema);

export default Group;
