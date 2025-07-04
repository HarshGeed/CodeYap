"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import default_pfp from "@/public/default_pfp.jpg";
import { connectSocket } from "@/lib/socket";

interface ConnectedUser {
  _id: string;
  username: string;
  profileImage?: string;
  lastMessage?: string;
}

export default function HomePage() {
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const [selectedUser, setSelectedUser] = useState<ConnectedUser | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<any>(null);

  // Connect socket once
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = connectSocket();
    }
  }, []);

  // Fetch connections when session is ready
  useEffect(() => {
    if (!session?.user?.id) return;
    const userId = session.user.id;

    async function fetchConnections() {
      setLoading(true);
      try {
        const res = await fetch(`/api/connections/${userId}`);
        const data = await res.json();
        setConnectedUsers(data);
      } catch {
        setConnectedUsers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchConnections();
  }, [session]);

  // Helper to get consistent roomId
  const getRoomId = (userId1: string, userId2: string) =>
    [userId1, userId2].sort().join("_");

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

  const handleUserClick = (user: ConnectedUser) => {
    setSelectedUser(user);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    const roomId = getRoomId(session?.user?.id, selectedUser._id);
    const msgObj = {
      roomId,
      message: newMessage,
      sender: session?.user?.id,
      receiver: selectedUser._id,
      timestamp: new Date().toISOString(),
    };
    // // Optimistically add to UI
    // setMessages((prev) => [...prev, msgObj]);

    socketRef.current.emit("send-message", msgObj);

    await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msgObj),
    });

    setNewMessage("");
  };

  return (
    <>
      <div className="grid grid-cols-[1fr_3fr] gap-2 h-screen">
        {/* 1st grid */}
        <div className="overflow-y-auto">
          <div className="flex mt-3">
            <h1 className="font-semibold text-3xl">Chats</h1>
            <button className="ml-auto bg-[#2b4a7b] text-white px-2 py-auto rounded">
              New Chat
            </button>
          </div>

          {/* Users which are connected */}
          <div className="mt-6">
            {loading ? (
              <div className="text-gray-400">Loading...</div>
            ) : connectedUsers.length === 0 ? (
              <div className="text-gray-400">No connections yet.</div>
            ) : (
              <ul className="space-y-3">
                {connectedUsers.map((user) => (
                  <li
                    key={user._id}
                    className="flex items-center gap-3 bg-[#232735] p-3 rounded-xl cursor-pointer"
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="h-[3.5rem] w-[3.5rem] bg-[#41403e] rounded-full relative">
                      <Image
                        src={user.profileImage || default_pfp}
                        alt="Profile pic"
                        fill
                        style={{ objectFit: "cover", borderRadius: "9999px" }}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-[1rem]">
                        {user.username}
                      </div>
                      <div className="text-xs text-gray-400">
                        {user.lastMessage || "No messages yet."}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* 2nd grid */}
        <div>
          {/* Column 2 */}
          <div className="h-full flex flex-col">
            {selectedUser ? (
              <div className="flex flex-col h-full">
                <div className="font-bold text-xl mb-2">
                  Chat with {selectedUser.username}
                </div>
                <div className="flex-1 overflow-y-auto bg-[#232735] p-4 rounded">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`mb-2 ${
                        msg.sender === session?.user?.id
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      <span
                        className={`inline-block px-3 py-1 rounded ${
                          msg.sender === session?.user?.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-white"
                        }`}
                      >
                        {msg.message}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex mt-2">
                  <input
                    className="flex-1 rounded-l px-2 py-1"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <button
                    className="bg-blue-600 text-white px-4 py-1 rounded-r"
                    onClick={handleSendMessage}
                  >
                    Send
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 flex items-center justify-center h-full">
                Select a user to start chatting.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
