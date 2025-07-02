import { NextRequest, NextResponse } from "next/server";
import Notification from "@/models/notificationModel";
import { connect } from "@/lib/dbConn";

export const GET = async (req: NextRequest, { params }: { params: { userId: string } }) => {
  await connect();
  const notifications = await Notification.find({ userId: params.userId }).sort({ time: -1 });
  return NextResponse.json(notifications, { status: 200 });
};