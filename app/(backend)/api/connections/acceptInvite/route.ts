// app/(backend)/api/connections/acceptInvite.ts
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/userModel";
import Notification from "@/models/notificationModel";
import { connect } from "@/lib/dbConn";

export const POST = async (req: NextRequest) => {
  await connect();
  const { userId, fromUserId, notificationId } = await req.json();

  // Add each other as connections (assume connections: [userId] in user model)
  await User.findByIdAndUpdate(userId, { $addToSet: { connections: fromUserId } });
  await User.findByIdAndUpdate(fromUserId, { $addToSet: { connections: userId } });

  // Remove the invite notification
  await Notification.findByIdAndDelete(notificationId);

  // Optionally, send notification to requester
  await Notification.create({
    userId: fromUserId,
    message: "Your connection request was accepted!",
    read: false,
    time: new Date(),
    meta: { type: "info" },
  });

  return NextResponse.json({ success: true });
};