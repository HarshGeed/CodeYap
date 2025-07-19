import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const onlineUsers = new Map(); // userId -> socketId
const userStatuses = new Map(); // userId -> { status, lastSeen }

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Register user for presence tracking
  socket.on("register-user", (userId) => {
    try {
      onlineUsers.set(userId, socket.id);
      userStatuses.set(userId, {
        status: "online",
        lastSeen: new Date().toISOString()
      });
      
      // Emit status update to all clients
      io.emit("user-status", { 
        userId, 
        status: "online",
        lastSeen: new Date().toISOString()
      });

      // Send all currently online users to the new user
      for (const [otherUserId, statusObj] of userStatuses.entries()) {
        if (otherUserId !== userId && statusObj.status === "online") {
          socket.emit("user-status", {
            userId: otherUserId,
            status: "online",
            lastSeen: statusObj.lastSeen,
          });
        }
      }
      
      console.log(`User ${userId} registered as online`);
    } catch (error) {
      console.error("Error registering user:", error);
    }
  });

  // Private chat room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("send-message", (msgObj) => {
    io.to(msgObj.roomId).emit("receive-message", msgObj);
  });

  // Typing event for private chat
  socket.on("typing", (data) => {
    // data: { roomId, userId }
    socket.to(data.roomId).emit("typing", data);
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

  // Typing event for group chat
  socket.on("group-typing", (data) => {
    // data: { groupId, userId }
    socket.to(data.groupId).emit("group-typing", data);
  });

  socket.on("disconnect", () => {
    for (const [userId, id] of onlineUsers.entries()) {
      if (id === socket.id) {
        onlineUsers.delete(userId);
  
        const lastSeen = new Date().toISOString();
        userStatuses.set(userId, {
          status: "offline",
          lastSeen: lastSeen
        });
  
        // Emit status update to all clients
        io.emit("user-status", {
          userId,
          status: "offline",
          lastSeen: lastSeen,
        });
  
        // --- ADD THIS: Update lastSeen in the database ---
        fetch(`http://localhost:3000/api/updateLastSeen/${userId}`, {
          method: "PATCH"
        }).catch((err) => {
          console.error("Failed to update lastSeen in DB:", err);
        });
  
        console.log(`User ${userId} disconnected and marked as offline`);
        break;
      }
    }
    console.log("A user disconnected:", socket.id);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running at http://localhost:${PORT}`);
  console.log("User status tracking: In-memory + Real-time updates");
  console.log(`Currently ${onlineUsers.size} users online`);
});