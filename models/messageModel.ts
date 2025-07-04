import mongoose from "mongoose";
const messageSchema = new mongoose.Schema({
  roomId: String,
  senderId: String,
  receiverId: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});
export default mongoose.models.Message || mongoose.model("Message", messageSchema);