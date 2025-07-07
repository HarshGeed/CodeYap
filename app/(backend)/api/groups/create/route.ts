import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/dbConn";
import Group from "@/models/groupModel";
import Notification from "@/models/notificationModel";

export async function POST(req: NextRequest) {
  const { name, members, creatorId } = await req.json();
  await connect();

  // Create group with admin as creator
  const group = await Group.create({
    name,
    members,
    admin: creatorId,
    acceptedMembers: [creatorId],
  });

  // Send notification to each member (except creator)
  for (const memberId of members) {
    if (memberId === creatorId) continue;
    await Notification.create({
      userId: memberId,
      message: `You've been invited to join the group "${name}"`,
      meta: { type: "group-invite", groupId: group._id, groupName: name },
    });
  }

  return NextResponse.json({ success: true, groupId: group._id });
}
