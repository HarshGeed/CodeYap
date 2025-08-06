import { NextRequest, NextResponse } from "next/server";
import User from "@/models/userModel";
import { connect } from "@/lib/dbConn";

export const DELETE = async (req: NextRequest) => {
  try {
    await connect();
    
    const { userId1, userId2 } = await req.json();
    
    if (!userId1 || !userId2) {
      return NextResponse.json(
        { error: "Both user IDs are required" },
        { status: 400 }
      );
    }

    // Remove connection from both users
    await User.findByIdAndUpdate(userId1, {
      $pull: { connections: userId2 }
    });

    await User.findByIdAndUpdate(userId2, {
      $pull: { connections: userId1 }
    });

    return NextResponse.json(
      { message: "Connection removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing connection:", error);
    return NextResponse.json(
      { error: "Failed to remove connection" },
      { status: 500 }
    );
  }
};
