import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/dbConn";
import Group from "@/models/groupModel";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { userId, description, profileImage } = await req.json();
  if (!id || !userId) {
    return NextResponse.json({ error: "Group ID and user ID are required" }, { status: 400 });
  }
  try {
    await connect();
    const group = await Group.findById(id);
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    // Only allow if user is a member
    if (!group.members.map(m => m.toString()).includes(userId)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    if (description !== undefined) group.description = description;
    if (profileImage !== undefined) group.profileImage = profileImage;
    await group.save();
    return NextResponse.json({ success: true, group });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 