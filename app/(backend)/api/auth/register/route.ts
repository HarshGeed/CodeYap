import { connect } from "@/lib/dbConn";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";

interface RegisterRequestBody {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  fullName?: string;
  bio?: string;
  profileImage?: string;
  coverImage?: string;
}

export const POST = async (req: NextRequest) => {
  await connect();

  const reqBody: RegisterRequestBody = await req.json();
  const { username, email, password, passwordConfirm, fullName, bio, profileImage, coverImage } = reqBody;

  if (!username || !email || !password || !passwordConfirm) {
    return NextResponse.json({ error: "All required fields must be provided" }, { status: 400 });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }

  // Validate password
  if (password !== passwordConfirm) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  try {
    const newUser = new User({
      username,
      email,
      password,
      fullName,
      bio,
      profileImage,
      coverImage,
    });

    await newUser.save();

    return NextResponse.json(
      {
        message: "User created successfully",
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Server error, try again later" }, { status: 500 });
  }
};