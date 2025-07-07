import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/dbConn";
import GroupMessage from "@/models/groupMessageModel";

export async function POST(req: NextRequest) {
  await connect();
  const { groupId, senderId, senderName, senderImage, message, timestamp } = await req.json();

  if (!groupId || !senderId || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const msg = await GroupMessage.create({
    groupId,
    senderId,
    senderName,
    senderImage,
    message,
    timestamp: timestamp || new Date().toISOString(),
  });

  return NextResponse.json(msg);
}