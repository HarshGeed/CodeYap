import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/dbConn";
import Group from "@/models/groupModel";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const { id } = params;
  const { userId, name, description, profileImage } = await req.json();
  if (!id || !userId) {
    return NextResponse.json({ error: "Group ID and user ID are required" }, { status: 400 });
  }
  try {
    await connect();
    const group = await Group.findById(id);
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    // Only allow if user is a member (acceptedMembers)
    if (!group.acceptedMembers.map(m => m.toString()).includes(userId)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    if (name !== undefined) group.name = name;
    if (description !== undefined) group.description = description;
    if (profileImage !== undefined) group.profileImage = profileImage;
    await group.save();
    const updatedGroup = await Group.findById(id)
      .populate({
        path: "acceptedMembers",
        select: "_id username profileImage"
      })
      .populate({
        path: "admin",
        select: "_id username profileImage"
      });
    if (!updatedGroup) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    const groupObj = updatedGroup.toObject() as unknown as Record<string, unknown>;
    groupObj.members = groupObj.acceptedMembers;
    delete groupObj.acceptedMembers;
    return NextResponse.json({ success: true, group: groupObj });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 