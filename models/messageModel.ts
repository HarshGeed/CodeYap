import mongoose from "mongoose";
const messageSchema = new mongoose.Schema({
  roomId: String,
  senderId: String,
  receiverId: String,
  message: String,
  fileType: String,
  originalName: String,
  timestamp: { type: Date, default: Date.now },
  seenBy: { type: [String], default: [] }, // Track which users have seen the message
  contentType: { type: String, default: "text" },
  code: {
    language: String,
    content: String,
  },
});
export default mongoose.models.Message || mongoose.model("Message", messageSchema);