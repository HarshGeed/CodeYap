import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/dbConn";
import User from "@/models/userModel";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";

  if (!query.trim()) {
    return NextResponse.json([]);
  }

  await connect();

  const users = await User.find({
    username: { $regex: query, $options: "i" },
  })
    .select("_id username profileImage")
    .limit(10);

  return NextResponse.json(users);
}