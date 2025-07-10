"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import default_pfp from "@/public/default_pfp.jpg";
import { useSession } from "next-auth/react";
import { connectSocket } from "@/lib/socket";
import { Paperclip } from "lucide-react";

interface UserChatRoomProps {
  selectedUser: any;
}

export default function UserChatRoom({ selectedUser }: UserChatRoomProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const socketRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  // Format time as "2:15 PM"
  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Format date as "Today" or "DD MMM YYYY"
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

  // Helper to get consistent roomId
  const getRoomId = (userId1: string, userId2: string) =>
    [userId1, userId2].sort().join("_");

  // Helper to guess file type from URL
  function fileTypeFromUrl(url: string) {
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return "image";
    if (url.match(/\.(mp4|webm|ogg|mov)$/i)) return "video";
    if (url.match(/\.(pdf|docx?|pptx?|xlsx?|txt)$/i)) return "document";
    return "file";
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Connect socket once
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = connectSocket();
    }
  }, []);

  // Join room and fetch messages when user is selected
  useEffect(() => {
    if (!selectedUser || !session?.user?.id) return;
    const roomId = getRoomId(session.user.id, selectedUser._id);

    // Join room
    socketRef.current.emit("join-room", roomId);

    // Fetch chat history
    (async () => {
      const res = await fetch(`/api/messages/${roomId}`);
      const data = await res.json();
      setMessages(data);
    })();
  }, [selectedUser, session?.user?.id]);

  // Listen for new messages (global listener)
  useEffect(() => {
    if (!socketRef.current) return;

    const handler = (msg: any) => {
      // Only add message if it's for the currently selected room
      if (
        selectedUser &&
        msg.roomId === getRoomId(session?.user?.id, selectedUser._id)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socketRef.current.on("receive-message", handler);

    // Cleanup
    return () => {
      socketRef.current.off("receive-message", handler);
    };
  }, [selectedUser, session?.user?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    const roomId = getRoomId(session?.user?.id, selectedUser._id);
    const msgObj = {
      roomId,
      message: newMessage,
      senderId: session?.user?.id,
      receiverId: selectedUser._id,
      timestamp: new Date().toISOString(),
    };

    socketRef.current.emit("send-message", msgObj);

    await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msgObj),
    });

    setNewMessage("");
  };

  // Handle file upload and send as message
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Limit to 8 files
    if (files.length > 8) {
      alert("You can only send a maximum of 8 files at a time.");
      setUploading(false);
      e.target.value = "";
      return;
    }

    setUploading(true);

    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append("file", file);
    }

    try {
      const res = await fetch("/api/imageUpload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.urls && Array.isArray(data.urls)) {
        for (const url of data.urls) {
          const roomId = getRoomId(session?.user?.id, selectedUser._id);
          const msgObj = {
            roomId,
            message: url,
            senderId: session?.user?.id,
            senderName: session?.user?.username,
            senderImage: session?.user?.profileImage,
            receiverId: selectedUser._id,
            timestamp: new Date().toISOString(),
            fileType: fileTypeFromUrl(url),
          };
          socketRef.current.emit("send-message", msgObj);
          await fetch("/api/messages/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(msgObj),
          });
        }
      }
    } catch (error) {
      alert("File upload failed.");
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="font-bold text-2xl mb-2 pt-4 px-4 text-[#c0cad6] tracking-wide">
        Chat with {selectedUser.username}
      </div>
      <div className="flex-1 overflow-y-auto p-4 rounded">
        {messages.map((msg, idx) => {
          const msgDate = new Date(msg.timestamp).toDateString();
          const showDate =
            idx === 0 ||
            msgDate !== new Date(messages[idx - 1].timestamp).toDateString();
          const isOwn = (msg.sender || msg.senderId) === session?.user?.id;

          const type = msg.fileType || fileTypeFromUrl(msg.message);

          return (
            <div key={idx}>
              {showDate && (
                <div className="flex justify-center my-2">
                  <span className="bg-[#22304a] text-[#60a5fa] text-xs px-4 py-1 rounded-full shadow my-3">
                    {formatDate(msg.timestamp)}
                  </span>
                </div>
              )}
              <div
                className={`mb-2 flex ${
                  isOwn ? "justify-end" : "justify-start"
                }`}
              >
                <span
                  className={`max-w-[70%] break-words px-4 py-2 rounded-2xl shadow ${
                    isOwn
                      ? "bg-[#3f495f] text-white rounded-br-sm"
                      : "bg-[#22304a] text-[#e0e7ef] rounded-bl-sm"
                  }`}
                >
                  {/* Render file or text */}
                  {type === "image" ? (
                    <Image
                      src={msg.message}
                      alt="uploaded"
                      width={320}
                      height={240}
                      onLoad={() => {
                        setTimeout(() => {
                          requestAnimationFrame(() => {
                            bottomRef.current?.scrollIntoView({
                              behavior: "smooth",
                            });
                          });
                        }, 100);
                      }}
                      style={{
                        objectFit: "contain",
                        borderRadius: "0.5rem",
                        maxWidth: "20rem", // matches max-w-xs
                        maxHeight: "15rem", // matches max-h-60
                        width: "100%",
                        height: "auto",
                      }}
                      className="rounded-lg"
                    />
                  ) : type === "video" ? (
                    <video
                      src={msg.message}
                      controls
                      className="max-w-xs max-h-60 rounded-lg"
                      width={320}
                      height={240}
                      onLoad={() => {
                        setTimeout(() => {
                          requestAnimationFrame(() => {
                            bottomRef.current?.scrollIntoView({
                              behavior: "smooth",
                            });
                          });
                        }, 100);
                      }}
                    />
                  ) : type === "document" ? (
                    <a
                      href={msg.message}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-blue-400"
                    >
                      📄 Document
                    </a>
                  ) : (
                    msg.message
                  )}
                  <span className="inline-block text-[11px] text-[#93c5fd] mt-1 text-right pl-2">
                    {formatTime(msg.timestamp)}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex mt-2 px-4 pb-4 items-center gap-2">
        {/* File upload button */}
        <label className="cursor-pointer bg-[#22304a] text-[#60a5fa] px-3 py-2 rounded-lg shadow border border-[#22304a] hover:bg-[#2563eb]/20 transition">
          <input
            type="file"
            multiple
            hidden
            onChange={handleFileChange}
            accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
            disabled={uploading}
          />
          {uploading ? "Uploading..." : <Paperclip />}
        </label>
        {/* Text input and send button */}
        <input
          className="flex-1 rounded-l-lg px-3 py-2 bg-[#171b24] text-[#e0e7ef] placeholder:text-[#64748b] border border-[#22304a] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type your message..."
          disabled={uploading}
        />
        <button
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6 py-2 rounded-r-lg shadow transition"
          onClick={handleSendMessage}
          disabled={uploading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
