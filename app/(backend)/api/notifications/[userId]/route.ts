import { NextRequest, NextResponse } from "next/server";
import Notification from "@/models/notificationModel";
import { connect } from "@/lib/dbConn";

export const GET = async (req: NextRequest, context: { params: Promise<{ userId: string }> }) => {
  await connect();
  const params = await context.params;
  const notifications = await Notification.find({ userId: params.userId }).sort({ time: -1 });
  return NextResponse.json(notifications, { status: 200 });
};