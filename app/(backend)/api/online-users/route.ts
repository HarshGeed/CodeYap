import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Use environment variable for socket server URL
    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
                           (process.env.NODE_ENV === 'production' 
                             ? "https://your-socket-server.onrender.com"
                             : 'http://localhost:3001');
    
    console.log(`Fetching online users from: ${socketServerUrl}`);
    
    const response = await fetch(`${socketServerUrl}/online-users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout for production
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      console.error(`Socket server responded with status: ${response.status}`);
      return NextResponse.json({ onlineUsers: [], userStatuses: {} });
    }
  } catch (error) {
    console.error("Error fetching online users:", error);
    return NextResponse.json({ onlineUsers: [], userStatuses: {} });
  }
} 