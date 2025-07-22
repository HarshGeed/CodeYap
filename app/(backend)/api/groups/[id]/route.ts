import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/dbConn";
import Group from "@/models/groupModel";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json(
      { error: "Group ID is required" },
      { status: 400 }
    );
  }
  try {
    await connect();
    const group = await Group.findById(id)
      .populate({
        path: "acceptedMembers",
        select: "_id username profileImage",
      })
      .populate({
        path: "admin",
        select: "_id username profileImage",
      });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    // Return acceptedMembers as members for frontend compatibility
    const groupObj = group.toObject() as unknown as Record<string, unknown>;
    groupObj.members = groupObj.acceptedMembers;
    delete groupObj.acceptedMembers;
    return NextResponse.json(groupObj);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
