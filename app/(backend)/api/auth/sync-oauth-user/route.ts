import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/dbConn";
import User from "@/models/userModel";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, image } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connect();

    // Find user in DB or create new one if not exists
    let dbUser = await User.findOne({ email });

    if (!dbUser) {
      dbUser = await User.create({
        username: name || email.split('@')[0],
        email,
        isOauth: true,
        profileImage: image,
      });
    }

    return NextResponse.json({
      id: dbUser._id,
      username: dbUser.username,
      email: dbUser.email,
      profileImage: dbUser.profileImage,
      isOauth: dbUser.isOauth,
    });
  } catch (error) {
    console.error("Error syncing OAuth user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
