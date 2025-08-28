import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/dbConn";
import User from "@/models/userModel";
import { compare } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Missing Email or Password" }, { status: 400 });
    }

    await connect();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const isValidPassword = await compare(password, user.password as string);

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    return NextResponse.json({
      id: (user._id as string).toString(),
      email: user.email,
      username: user.username,
      profileImage: user.profileImage,
      isOauth: user.isOauth || false,
    });
  } catch (error) {
    console.error("Error validating credentials:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
