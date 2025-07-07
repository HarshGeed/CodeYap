import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Private chat room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("send-message", (msgObj) => {
    io.to(msgObj.roomId).emit("receive-message", msgObj);
  });

  // --- GROUP CHAT SUPPORT ---
  socket.on("join-group", (groupId) => {
    socket.join(groupId);
    console.log(`Socket ${socket.id} joined group ${groupId}`);
  });

  socket.on("leave-group", (groupId) => {
    socket.leave(groupId);
    console.log(`Socket ${socket.id} left group ${groupId}`);
  });

  socket.on("send-group-message", (msgObj) => {
    io.to(msgObj.groupId).emit("receive-group-message", msgObj);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running at http://localhost:${PORT}`);
});