"use client";

import React, { useEffect, useRef, useState } from "react";
import { connectSocket } from "@/lib/socket";

export default function ChatRoom({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = React.use(params);
  const socketRef = useRef<any>(null);
  const [messages, setMessages] = useState<{ message: string; sender: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    socketRef.current = connectSocket();

    socketRef.current.emit("join-room", roomId);

    socketRef.current.on("receive-message", (data: any) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId]);

  const sendMessage = () => {
    if (newMessage.trim() === "") return;
    socketRef.current.emit("send-message", {
      roomId,
      message: newMessage,
      sender: "you",
    });
    setMessages((prev) => [...prev, { message: newMessage, sender: "you" }]);
    setNewMessage("");
  };

  return (
    <div className="p-4">
      <div className="mb-4 h-[300px] overflow-y-auto border p-2 rounded bg-black text-white">
        {messages.map((msg, i) => (
          <div key={i} className="mb-2">
            <strong>{msg.sender}: </strong>{msg.message}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="border p-2 flex-1 rounded"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
