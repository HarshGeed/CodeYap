import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/dbConn";
import Group from "@/models/groupModel";
import User from "@/models/userModel";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
  }
  try {
    await connect();
    const group = await Group.findById(id)
      .populate({
        path: "members",
        select: "_id username profileImage"
      })
      .populate({
        path: "admin",
        select: "_id username profileImage"
      });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    return NextResponse.json(group);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 