import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/dbConn";
import Group from "@/models/groupModel";

export async function PATCH(req: NextRequest, { params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const { userId } = await req.json();
  if (!groupId || !userId) {
    return NextResponse.json({ error: "Group ID and user ID are required" }, { status: 400 });
  }
  try {
    await connect();
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    // Remove user from members and acceptedMembers
    group.members = group.members.filter((m: any) => m.toString() !== userId);
    group.acceptedMembers = group.acceptedMembers.filter((m: any) => m.toString() !== userId);
    // If admin leaves, transfer admin to next member (if any)
    if (group.admin.toString() === userId) {
      if (group.members.length > 0) {
        group.admin = group.members[0];
      } else {
        // No members left, group can be deleted or left without admin
        group.admin = undefined;
      }
    }
    await group.save();
    return NextResponse.json({ success: true, group });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 