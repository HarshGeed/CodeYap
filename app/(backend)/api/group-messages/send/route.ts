import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/dbConn";
import GroupMessage from "@/models/groupMessageModel";
import User from "@/models/userModel";

export async function POST(req: NextRequest) {
  await connect();
  const { groupId, senderId, message, timestamp } = await req.json();

  if (!groupId || !senderId || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Fetch sender info
  const sender = await User.findById(senderId);

  const msg = await GroupMessage.create({
    groupId,
    senderId,
    senderName: sender?.username,
    senderImage: sender?.profileImage,
    message,
    timestamp: timestamp || new Date().toISOString(),
  });

  return NextResponse.json(msg);
}