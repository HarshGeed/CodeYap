import { NextRequest, NextResponse } from "next/server";
import Message from "@/models/messageModel";
import { connect } from "@/lib/dbConn";

export const GET = async (
  req: NextRequest,
  { params }: { params: { roomId: string } }
) => {
  await connect();
  const messages = await Message.find({ roomId: params.roomId }).sort({
    timestamp: 1,
  });
  return NextResponse.json(messages, { status: 200 });
};
