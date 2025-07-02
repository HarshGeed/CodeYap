import { NextRequest, NextResponse } from "next/server";
import Notification from "@/models/notificationModel";
import { connect } from "@/lib/dbConn";

export const PATCH = async (req: NextRequest, { params }: { params: { userId: string } }) => {
  await connect();
  await Notification.updateMany({ userId: params.userId, read: false }, { $set: { read: true } });
  return NextResponse.json({ success: true });
};