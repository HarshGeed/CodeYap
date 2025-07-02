import { NextRequest, NextResponse } from "next/server";
import Notification from "@/models/notificationModel";
import { connect } from "@/lib/dbConn";

export const DELETE = async (req: NextRequest, { params }: { params: { notifId: string } }) => {
  await connect();
  await Notification.findByIdAndDelete(params.notifId);
  return NextResponse.json({ success: true });
};