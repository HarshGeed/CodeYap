// app/(backend)/api/connections/rejectInvite.ts
import { NextRequest, NextResponse } from "next/server";
import Notification from "@/models/notificationModel";
import { connect } from "@/lib/dbConn";

export const POST = async (req: NextRequest) => {
  await connect();
  const { notificationId, fromUserId } = await req.json();

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