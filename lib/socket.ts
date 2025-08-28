import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
const registeredUsers = new Set<string>();

export const connectSocket = (): Socket => {
  if (!socket) {
    socket = io("http://localhost:3001");

    socket.on("disconnect", () => {
      socket = null;
      registeredUsers.clear();
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
      socket.emit("register-user", userId);
      registeredUsers.add(userId);
    });
  }
};
