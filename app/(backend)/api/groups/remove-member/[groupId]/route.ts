import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/dbConn";
import Group from "@/models/groupModel";

export async function PATCH(req: NextRequest, { params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const { adminId, memberId } = await req.json();
  if (!groupId || !adminId || !memberId) {
    return NextResponse.json({ error: "Group ID, admin ID, and member ID are required" }, { status: 400 });
  }
  try {
    await connect();
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    if (group.admin.toString() !== adminId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    if (group.admin.toString() === memberId) {
      return NextResponse.json({ error: "Cannot remove admin. Use change admin first." }, { status: 400 });
    }
    group.members = group.members.filter((m: any) => m.toString() !== memberId);
    group.acceptedMembers = group.acceptedMembers.filter((m: any) => m.toString() !== memberId);
    await group.save();
    return NextResponse.json({ success: true, group });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 