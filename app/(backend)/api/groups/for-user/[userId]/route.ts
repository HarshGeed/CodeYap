import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Group from "@/models/groupModel";
import { connect } from "@/lib/dbConn";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = await params;

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    await connect();
    const groups = await Group.find({
      acceptedMembers: new mongoose.Types.ObjectId(userId),
    });
    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
