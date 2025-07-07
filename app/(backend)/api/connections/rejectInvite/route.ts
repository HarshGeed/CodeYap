// app/(backend)/api/connections/rejectInvite.ts
import { NextRequest, NextResponse } from "next/server";
import Notification from "@/models/notificationModel";
import Group from "@/models/groupModel";
import { connect } from "@/lib/dbConn";

export const POST = async (req: NextRequest) => {
  await connect();
  const { notificationId, fromUserId, groupId, userId } = await req.json();

  if (groupId && userId) {
    // Remove user from acceptedMembers if present (optional, for safety)
    await Group.findByIdAndUpdate(groupId, { $pull: { acceptedMembers: userId } });
    // Mark notification as accepted: false (or delete)
    await Notification.findByIdAndUpdate(notificationId, { "meta.accepted": false });
    return NextResponse.json({ success: true, group: true });
  }

  await Notification.findByIdAndDelete(notificationId);
  // Optionally, send notification to requester
  await Notification.create({
    userId: fromUserId,
    message: "Your connection request was rejected.",
    read: false,
    time: new Date(),
    meta: { type: "info" },
  });

  return NextResponse.json({ success: true });
};