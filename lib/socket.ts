import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = (): Socket => {
  if (!socket) {
    socket = io("http://localhost:3001");

    socket.on("disconnect", () => {
      socket = null;
    });
  }
  return socket;
};
