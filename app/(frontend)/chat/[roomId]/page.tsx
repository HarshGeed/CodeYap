"use client";

import React, { useEffect, useRef, useState } from "react";
import { connectSocket } from "@/lib/socket";
import { useSession } from "next-auth/react";

export default function ChatRoom({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = React.use(params);
  const { data: session } = useSession();
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
    if (newMessage.trim() === "" || !session?.user?.name) return;
    socketRef.current.emit("send-message", {
      roomId,
      message: newMessage,
      sender: session.user.name,
    });
    setNewMessage("");
  };

  return (
    <div className="p-4">
      <div className="mb-4 h-[300px] overflow-y-auto border p-2 rounded bg-black text-white">
        {messages.map((msg, i) => {
          const isSender = session?.user?.name === msg.sender;
          return (
            <div
              key={i}
              className={`mb-2 flex ${isSender ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] px-3 py-2 rounded ${
                  isSender
                    ? "bg-blue-600 text-white text-right"
                    : "bg-gray-700 text-white text-left"
                }`}
              >
                <div className="text-xs font-semibold mb-1">{msg.sender}</div>
                <div>{msg.message}</div>
              </div>
            </div>
          );
        })}
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
          disabled={!session?.user?.name}
        >
          Send
        </button>
      </div>
    </div>
  );
}
