import { NextRequest, NextResponse } from "next/server";
import Message from "@/models/messageModel";
import { connect } from "@/lib/dbConn";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) => {
  await connect();
  const resolvedParams = await params;
  const messages = await Message.find({ roomId: resolvedParams.roomId }).sort({
    timestamp: 1,
  });
  return NextResponse.json(messages, { status: 200 });
};

export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) => {
  await connect();
  const { messageId, userId } = await req.json();
  if (!messageId || !userId) {
    return NextResponse.json({ error: 'Missing messageId or userId' }, { status: 400 });
  }
  const msg = await Message.findByIdAndUpdate(
    messageId,
    { $addToSet: { seenBy: userId } },
    { new: true }
  );
  if (!msg) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }
  return NextResponse.json(msg, { status: 200 });
};
