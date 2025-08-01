// app/(backend)/api/connections/acceptInvite.ts
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/userModel";
import Notification from "@/models/notificationModel";
import Group from "@/models/groupModel";
import { connect } from "@/lib/dbConn";

export const POST = async (req: NextRequest) => {
  await connect();
  const { userId, fromUserId, notificationId, groupId } = await req.json();

  if (groupId) {
    // Accept group invite: add user to acceptedMembers
    await Group.findByIdAndUpdate(groupId, { $addToSet: { acceptedMembers: userId } });
    // Mark notification as accepted
    await Notification.findByIdAndUpdate(notificationId, { "meta.accepted": true });
    return NextResponse.json({ success: true, group: true });
  }

  // Accept connection invite (existing logic)
  await User.findByIdAndUpdate(userId, { $addToSet: { connections: fromUserId } });
  await User.findByIdAndUpdate(fromUserId, { $addToSet: { connections: userId } });
  await Notification.findByIdAndDelete(notificationId);
  await Notification.create({
    userId: fromUserId,
    message: "Your connection request was accepted!",
    read: false,
    time: new Date(),
    meta: { type: "info" },
  });

  return NextResponse.json({ success: true });
};