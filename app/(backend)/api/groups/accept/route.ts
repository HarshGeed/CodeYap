// WE NEED TO REMOVE THIS BECAUSE IT IS UNUSED BUT BEFORE DLETEING IT CHECK IT

import { NextRequest, NextResponse } from "next/server";
import Group from "@/models/groupModel";
import { connect } from "@/lib/dbConn";

export async function POST(req: NextRequest) {
  const { groupId, userId } = await req.json();
  await connect();
  await Group.findByIdAndUpdate(groupId, {
    $addToSet: { acceptedMembers: userId },
  });
  return NextResponse.json({ success: true });
}