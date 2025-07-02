import mongoose, { Schema, Document, model, models } from "mongoose";

export interface INotification extends Document {
  userId: string;
  message: string;
  time: Date;
  read: boolean;
  meta: mongoose.Types.ObjectId;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true },
    message: { type: String, required: true },
    time: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    meta: {type: Schema.Types.Mixed},
  },
  { timestamps: true }
);

export default models.Notification ||
  model<INotification>("Notification", notificationSchema);