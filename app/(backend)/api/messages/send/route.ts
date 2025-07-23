// app/(backend)/api/messages/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import Message from "@/models/messageModel";
import { connect } from "@/lib/dbConn";

export const POST = async (req: NextRequest) => {
  await connect();
  const body = await req.json();
  const msg = await Message.create(body);
  return NextResponse.json(msg, { status: 201 });
};