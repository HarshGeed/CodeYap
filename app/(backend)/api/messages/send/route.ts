// app/(backend)/api/messages/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import Message from "@/models/messageModel";
import { connect } from "@/lib/dbConn";

export const POST = async (req: NextRequest) => {
  await connect();
  const { roomId, senderId, receiverId, message } = await req.json();
  const msg = await Message.create({ roomId, senderId, receiverId, message });
  return NextResponse.json(msg, { status: 201 });
};