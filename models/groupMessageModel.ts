import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGroupMessage extends Document {
  groupId: mongoose.Types.ObjectId | string;
  senderId: mongoose.Types.ObjectId | string;
  senderName?: string;
  senderImage?: string;
  message: string;
  timestamp: string;
}

const groupMessageSchema = new Schema<IGroupMessage>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderName: String,
    senderImage: String,
    message: { type: String, required: true },
    timestamp: { type: String, required: true },
  },
  { timestamps: false }
);

const GroupMessage: Model<IGroupMessage> =
  mongoose.models.GroupMessage || mongoose.model<IGroupMessage>("GroupMessage", groupMessageSchema);

export default GroupMessage;