import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    // This would need to be connected to the socket server
    // For now, we'll return a simple response
    const response = await fetch('http://localhost:3001/online-users');
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }
    return NextResponse.json({ onlineUsers: [] });
  } catch (error) {
    console.error("Error fetching online users:", error);
    return NextResponse.json({ onlineUsers: [] });
  }
}; 