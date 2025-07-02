import { NextRequest, NextResponse } from "next/server";
import User from "@/models/userModel";
import { connect } from "@/lib/dbConn";

export const GET = async (req: NextRequest, { params }: { params: { userId: string } }) => {
  await connect();
  const user = await User.findById(params.userId).populate({
    path: "connections",
    select: "_id username profileImage", // Add other fields if needed
  });

  if (!user) {
    return NextResponse.json([], { status: 200 });
  }

  // Optionally, fetch last message for each connection here

  return NextResponse.json(user.connections, { status: 200 });
};