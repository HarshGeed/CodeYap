import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/dbConn";
import Group from "@/models/groupModel";

export async function PATCH(req: NextRequest, { params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const { adminId, newAdminId } = await req.json();
  if (!groupId || !adminId || !newAdminId) {
    return NextResponse.json({ error: "Group ID, admin ID, and new admin ID are required" }, { status: 400 });
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
    if (!group.members.map((m: any) => m.toString()).includes(newAdminId)) {
      return NextResponse.json({ error: "New admin must be a group member" }, { status: 400 });
    }
    group.admin = newAdminId;
    await group.save();
    return NextResponse.json({ success: true, group });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 