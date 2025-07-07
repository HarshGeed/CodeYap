"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import default_pfp from "@/public/default_pfp.jpg";
import { connectSocket } from "@/lib/socket";
import GroupChatRoom from "@/components/GroupChatRoom";

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

  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ConnectedUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  const handleGroupClick = (group: any) => {
    setSelectedUser(null); // Deselect individual user
    setSelectedGroup(group);
  };

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const res = await fetch(
      `/api/search-users?query=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    setSearchResults(data);
    setSearchLoading(false);
  };

  const handleResultClick = (userId: string) => {
    setShowDialog(false);
    setSearch("");
    setSearchResults([]);
    // Redirect to profile page
    window.location.href = `/profile/${userId}`;
  };

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

  // Connect socket once
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = connectSocket();
    }
  }, []);

  useEffect(() => {
  if (!session?.user?.id) return;

  const fetchGroups = async () => {
    try {
      const res = await fetch(`/api/groups/for-user/${session?.user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch groups");
      const data = await res.json();
      setGroups(data);
    } catch (err) {
      console.error(err);
    }
  };

  fetchGroups();
}, [session?.user?.id]);



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

  return (
    <>
      {showDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowDialog(false)}
        >
          <div className="bg-[#18181b] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-[#232323]">
            <div className="flex items-center mb-4">
              <input
                autoFocus
                className="flex-1 px-4 py-2 rounded-lg bg-[#232323] text-[#fafafa] placeholder:text-[#52525b] border border-[#232323] focus:outline-none focus:ring-2 focus:ring-[#232323] transition"
                placeholder="Search username..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <button
                className="ml-3 text-[#a1a1aa] hover:text-[#fafafa] text-xl"
                onClick={() => setShowDialog(false)}
              >
                ×
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {searchLoading ? (
                <div className="text-[#a1a1aa] text-center py-4">
                  Searching...
                </div>
              ) : searchResults.length === 0 && search.trim() ? (
                <div className="text-[#52525b] text-center py-4">
                  No users found.
                </div>
              ) : (
                <ul>
                  {searchResults.map((user) => (
                    <li
                      key={user._id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#232323] cursor-pointer transition"
                      onClick={() => handleResultClick(user._id)}
                    >
                      <div className="h-10 w-10 bg-[#232323] rounded-full relative border border-[#232323]">
                        <Image
                          src={user.profileImage || default_pfp}
                          alt="Profile pic"
                          fill
                          style={{ objectFit: "cover", borderRadius: "9999px" }}
                        />
                      </div>
                      <div>
                        <div className="font-medium text-base text-[#fafafa]">
                          {user.username}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-[1fr_3fr] h-[calc(100vh-1.5rem)] gap-4 my-3">
        {/* 1st grid */}
        <div className="h-full overflow-y-auto bg-gradient-to-b from-[#1b1f27] to-[#0a0a0a] rounded-2xl px-4 py-3 shadow-2xl border border-[#22304a]/30">
          <div className="flex items-center mb-6">
            <h1 className="font-semibold text-3xl text-[#7e90a7] tracking-wide">
              Chats
            </h1>
            <button
              className="ml-auto cursor-pointer bg-[#2a395d] hover:opacity-80 text-[#fafafa] px-4 py-1 rounded-lg shadow transition border border-[#232323]/80"
              onClick={() => setShowDialog(true)}
            >
              New Chat
            </button>
          </div>
          {/* Users which are connected */}
          <div className="mt-2">
            {loading ? (
              <div className="text-gray-400">Loading...</div>
            ) : connectedUsers.length === 0 ? (
              <div className="text-gray-500">No connections yet.</div>
            ) : (
              <ul className="space-y-3">
                {connectedUsers.map((user) => (
                  <li
                    key={user._id}
                    className="flex items-center gap-3 bg-[#282d38] hover:bg-[#22304a] p-3 rounded-xl cursor-pointer transition"
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="h-14 w-14 bg-[#22304a] rounded-full relative border-2 border-[#2563eb]/30">
                      <Image
                        src={user.profileImage || default_pfp}
                        alt="Profile pic"
                        fill
                        style={{ objectFit: "cover", borderRadius: "9999px" }}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-base text-[#e0e7ef]">
                        {user.username}
                      </div>
                      <div className="text-xs text-[#60a5fa]/80">
                        {user.lastMessage || "No messages yet."}
                      </div>
                    </div>
                  </li>
                ))}
                {/* groups */}
                {groups.map((group) => (
                  <li
                    key={group._id}
                    className="flex items-center gap-3 bg-[#282d38] hover:bg-[#22304a] p-3 rounded-xl cursor-pointer transition"
                    onClick={() => handleGroupClick(group)}
                  >
                    <div className="h-14 w-14 bg-[#22304a] rounded-full flex items-center justify-center text-[#60a5fa] font-bold text-xl">
                      {group.name[0]}
                    </div>
                    <div>
                      <div className="font-medium text-base text-[#e0e7ef]">
                        {group.name}
                      </div>
                      <div className="text-xs text-[#60a5fa]/80">Group</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* 2nd grid */}
        <div className="h-full overflow-y-auto">
          {/* Column 2 */}
          <div className="h-full flex flex-col bg-gradient-to-b from-[#1b1f27] to-[#0a0a0a] rounded-2xl border border-[#22304a]/30 shadow-2xl">
            {selectedGroup ? (
              <GroupChatRoom group={selectedGroup} session={session} />
            ) : selectedUser ? (
              <div className="flex flex-col h-full">
                <div className="font-bold text-2xl mb-2 pt-4 px-4 text-[#c0cad6] tracking-wide">
                  Chat with {selectedUser.username}
                </div>
                <div className="flex-1 overflow-y-auto p-4 rounded">
                  {(() => {
                    return messages.map((msg, idx) => {
                      const msgDate = new Date(msg.timestamp).toDateString();
                      const showDate =
                        idx === 0 ||
                        msgDate !==
                          new Date(messages[idx - 1].timestamp).toDateString();
                      return (
                        <div key={idx}>
                          {showDate && (
                            <div className="flex justify-center my-2">
                              <span className="bg-[#22304a] text-[#60a5fa] text-xs px-4 py-1 rounded-full shadow">
                                {formatDate(msg.timestamp)}
                              </span>
                            </div>
                          )}
                          <div
                            className={`mb-2 flex ${
                              (msg.sender || msg.senderId) === session?.user?.id
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <span
                              className={`max-w-[70%] break-words px-4 py-2 rounded-2xl shadow ${
                                (msg.senderId || msg.sender) ===
                                session?.user?.id
                                  ? "bg-[#3f495f] text-white rounded-br-sm"
                                  : "bg-[#22304a] text-[#e0e7ef] rounded-bl-sm"
                              }`}
                            >
                              {msg.message}
                              <span className="block text-[11px] text-[#93c5fd] mt-1 text-right">
                                {formatTime(msg.timestamp)}
                              </span>
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
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
            ) : (
              <div className="text-gray-400 flex items-center justify-center h-full text-lg">
                Select a user or group to start chatting.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
