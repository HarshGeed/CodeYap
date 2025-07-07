"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import default_pfp from "@/public/default_pfp.jpg";
import { useSession } from "next-auth/react";

interface GroupChatRoomProps {
  group: {
    _id: string;
    name: string;
    members: { _id: string; username: string; profileImage?: string }[];
  };
  session: any;
}

interface GroupMessage {
  _id?: string;
  groupId: string;
  senderId: string;
  senderName?: string;
  senderImage?: string;
  message: string;
  timestamp: string;
}

export default function GroupChatRoom({ group }: GroupChatRoomProps) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const {data: session} = useSession();

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return "Today";
    }
    return date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!group?._id || !session?.user?.id) return;

    import("@/lib/socket").then(({ connectSocket }) => {
      if (!socketRef.current) {
        socketRef.current = connectSocket();
      }

      const socket = socketRef.current;

      socket.emit("join-group", group._id);

      fetch(`/api/group-messages/get/${group._id}`)
        .then((res) => res.json())
        .then(setMessages);

      // Remove any previous handler before adding a new one
      socket.off("receive-group-message");
      const handler = (msg: GroupMessage) => {
        if (msg.groupId === group._id) {
          setMessages((prev) => [...prev, msg]);
        }
      };

      socket.on("receive-group-message", handler);

      return () => {
        socket.emit("leave-group", group._id);
        socket.off("receive-group-message", handler);
      };
    });
  }, [group?._id, session?.user?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const msgObj: GroupMessage = {
      groupId: group._id,
      senderId: session?.user?.id,
      senderName: session?.user?.username,
      senderImage: session?.user?.profileImage,
      message: newMessage,
      timestamp: new Date().toISOString(),
    };

    console.log("this is msbObj", msgObj);

    socketRef.current.emit("send-group-message", msgObj);

    await fetch("/api/group-messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msgObj),
    });

    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Group Header */}
      <div className="flex items-center gap-4 px-4 pt-4 pb-2 border-b border-[#22304a]/30">
        <div className="h-12 w-12 bg-[#22304a] rounded-full flex items-center justify-center text-[#60a5fa] font-bold text-2xl">
          {group.name[0]}
        </div>
        <div>
          <div className="font-bold text-xl text-[#c0cad6]">{group.name}</div>
          <div className="text-xs text-[#60a5fa]/80">
            {group.members.length} members
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 rounded">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-center mt-10">
            No messages yet.
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const msgDate = new Date(msg.timestamp).toDateString();
              const showDate =
                idx === 0 ||
                msgDate !== new Date(messages[idx - 1].timestamp).toDateString();
              const isOwn = msg.senderId === session.user.id;

              return (
                <div key={msg._id || idx}>
                  {showDate && (
                    <div className="flex justify-center my-2">
                      <span className="bg-[#22304a] text-[#60a5fa] text-xs px-4 py-1 rounded-full shadow">
                        {formatDate(msg.timestamp)}
                      </span>
                    </div>
                  )}
                  <div className={`mb-2 flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div className="flex items-end gap-2 max-w-[70%]">
                      {!isOwn && (
                        <div className="h-8 w-8 rounded-full bg-[#232323] relative">
                          <Image
                            src={msg.senderImage || default_pfp}
                            alt="Profile pic"
                            fill
                            style={{ objectFit: "cover", borderRadius: "9999px" }}
                          />
                        </div>
                      )}
                      <div>
                        <span
                          className={`inline-block px-4 py-2 rounded-2xl shadow ${
                            isOwn
                              ? "bg-[#3f495f] text-white rounded-br-sm"
                              : "bg-[#22304a] text-[#e0e7ef] rounded-bl-sm"
                          }`}
                        >
                          {msg.message}
                          <span className="block text-[11px] text-[#93c5fd] mt-1 text-right">
                            {formatTime(msg.timestamp)}
                          </span>
                        </span>
                        {!isOwn && (
                          <div className="text-xs text-[#60a5fa]/80 mt-1 ml-1">
                            {msg.senderName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="flex mt-2 px-4 pb-4">
        <input
          className="flex-1 rounded-l-lg px-3 py-2 bg-[#171b24] text-[#e0e7ef] placeholder:text-[#64748b] border border-[#22304a] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type your message..."
        />
        <button
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6 py-2 rounded-r-lg shadow transition"
          onClick={handleSendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
