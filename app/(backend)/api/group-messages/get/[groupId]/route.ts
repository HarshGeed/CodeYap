import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/dbConn";
import GroupMessage from "@/models/groupMessageModel";

export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  await connect();
  const { groupId } = params;
  if (!groupId) {
    return NextResponse.json({ error: "Group ID required" }, { status: 400 });
  }
  const messages = await GroupMessage.find({ groupId }).sort({ timestamp: 1 });
  return NextResponse.json(messages);
}