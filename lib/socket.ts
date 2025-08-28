import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
const registeredUsers = new Set<string>();

export const connectSocket = (): Socket => {
  if (!socket) {
    // Determine the socket server URL based on environment
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
                     (process.env.NODE_ENV === 'production' 
                       ? "wss://your-socket-server.onrender.com"
                       : "http://localhost:3001");
    
    console.log(`Connecting to socket server: ${socketUrl}`);
    
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'], // Support both transports
      timeout: 20000,
      forceNew: false,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected successfully");
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      socket = null;
      registeredUsers.clear();
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });
  }
  return socket;
};

export const registerUser = (userId: string): void => {
  if (!socket || registeredUsers.has(userId)) return;
  
  // Ensure socket is connected before registering
  if (socket.connected) {
    console.log("Registering user:", userId);
    socket.emit("register-user", userId);
    registeredUsers.add(userId);
  } else {
    console.log("Socket not connected, waiting...");
    socket.once('connect', () => {
      console.log("Socket connected, now registering user:", userId);
      socket?.emit("register-user", userId);
      registeredUsers.add(userId);
    });
  }
};
