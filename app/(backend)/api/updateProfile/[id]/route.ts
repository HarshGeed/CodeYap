import { NextRequest, NextResponse } from "next/server";
import User from "@/models/userModel";
import { connect } from "@/lib/dbConn";

export const PATCH = async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    await connect();
    const body = await req.json();

    // Only allow updating specific fields
    const updateFields: any = {};
    [
      "username",
      "profileImage",
      "email",
      "linkedin",
      "github",
      "bio",
      "about",
      "location",
      "techStacks",
    ].forEach((field) => {
      if (body[field] !== undefined) updateFields[field] = body[field];
    });

    const user = await User.findByIdAndUpdate(params.id, updateFields, {
      new: true,
      runValidators: true,
      select: "-password -__v",
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
};