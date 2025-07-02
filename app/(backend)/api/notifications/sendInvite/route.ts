import { NextRequest, NextResponse } from "next/server";
import Notification from "@/models/notificationModel";
import { connect } from "@/lib/dbConn";

export const POST = async (req: NextRequest) => {
  await connect();
  const { toUserId, fromUserId, fromUsername } = await req.json();

  // Prevent duplicate invites (optional)
  const existing = await Notification.findOne({
    userId: toUserId,
    "meta.fromUserId": fromUserId,
    "meta.type": "invite",
    read: false,
  });
  if (existing) {
    return NextResponse.json({ message: "Invite already sent" }, { status: 409 });
  }

  const notif = await Notification.create({
    userId: toUserId,
    message: `${fromUsername} wants to connect with you.`,
    read: false,
    time: new Date(),
    meta: {
      fromUserId,
      fromUsername,
      type: "invite",
    },
  });
  return NextResponse.json(notif, { status: 201 });
};