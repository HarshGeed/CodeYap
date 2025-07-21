import { NextRequest, NextResponse } from "next/server";
import User from "@/models/userModel";
import { connect } from "@/lib/dbConn";
import Message from "@/models/messageModel";

export const GET = async (req: NextRequest, { params }: { params: { userId: string } }) => {
  await connect();
  const user = await User.findById(params.userId).populate({
    path: "connections",
    select: "_id username profileImage lastSeen", // Include lastSeen from database
  });

  if (!user) {
    return NextResponse.json([], { status: 200 });
  }

  // Fetch last message for each connection
  const connectionsWithLastMessage = await Promise.all(
    user.connections.map(async (conn: any) => {
      const lastMsg = await Message.findOne({
        $or: [
          { senderId: params.userId, receiverId: conn._id.toString() },
          { senderId: conn._id.toString(), receiverId: params.userId },
        ],
      })
        .sort({ timestamp: -1 })
        .lean();
      return {
        ...conn.toObject(),
        lastMessage: lastMsg ? lastMsg.message : null,
        lastMessageTime: lastMsg ? lastMsg.timestamp : null, // <-- add this line
        unread: lastMsg
          ? lastMsg.receiverId === params.userId && !(lastMsg.seenBy || []).includes(params.userId)
          : false,
      };
    })
  );

  return NextResponse.json(connectionsWithLastMessage, { status: 200 });
};