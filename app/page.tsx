"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import default_pfp from "@/public/default_pfp.jpg";
import { connectSocket } from "@/lib/socket";
import GroupChatRoom from "@/components/GroupChatRoom";
import UserChatRoom from "@/components/UserChatRoom";

interface Socket {
  emit: (event: string, data: unknown) => void;
  on: (event: string, handler: (data: unknown) => void) => void;
  off: (event: string, handler: (data: unknown) => void) => void;
}

interface ConnectedUser {
  _id: string;
  username: string;
  profileImage?: string;
  lastMessage?: string;
  status?: "online" | "offline";
  lastSeen?: string;
}

interface Group {
  _id: string;
  name: string;
  members: { _id: string; username: string; profileImage?: string }[];
}

export default function HomePage() {
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const [selectedUser, setSelectedUser] = useState<ConnectedUser | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ConnectedUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const statusBuffer = useRef<{ userId: string; status: string; lastSeen?: string }[]>([]);

  const handleGroupClick = (group: Group) => {
    setSelectedUser(null); // Deselect individual user
    setSelectedGroup(group);
  };

  const handleUserClick = (user: ConnectedUser) => {
    setSelectedUser(user);
    setSelectedGroup(null);
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

  const handleUpdateLastMessage = (userId: string, message: string) => {
    setConnectedUsers(prev =>
      prev.map(user =>
        user._id === userId
          ? { ...user, lastMessage: message }
          : user
      )
    );
  };


  // Connect socket and listen for status updates
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = connectSocket() as Socket;
    }
    
    // Register user for status tracking
    if (socketRef.current && session?.user?.id) {
      socketRef.current.emit("register-user", session.user.id);
    }

    // Listen for user status updates
    const statusHandler = (data: unknown) => {
      const { userId, status, lastSeen } = data as { userId: string; status: string; lastSeen?: string };
      if (connectedUsers.length === 0) {
        statusBuffer.current.push({ userId, status, lastSeen });
        return;
      }
      setConnectedUsers(prev => 
        prev.map(user => 
          user._id === userId
            ? { ...user, status: status as "online" | "offline", lastSeen: lastSeen || user.lastSeen }
            : user
        )
      );
    };

    socketRef.current?.on("user-status", statusHandler);

    return () => {
      socketRef.current?.off("user-status", statusHandler);
    };
  }, [session?.user?.id, connectedUsers.length]);

  // After users are loaded, apply buffered status events
  useEffect(() => {
    if (connectedUsers.length > 0 && statusBuffer.current.length > 0) {
      setConnectedUsers(prev =>
        prev.map(user => {
          const match = statusBuffer.current.find(e => e.userId === user._id);
          return match
            ? { ...user, status: match.status as "online" | "offline", lastSeen: match.lastSeen || user.lastSeen }
            : user;
        })
      );
      statusBuffer.current = [];
    }
  }, [connectedUsers.length]);

  // Handle page unload to update lastSeen
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session?.user?.id) {
        // Use sendBeacon for reliable delivery during page unload
        navigator.sendBeacon(`/api/updateLastSeen/${session.user.id}`);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [session?.user?.id]);

  // Fetch groups
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
        // Initialize all users as offline initially (they'll be updated by socket events)
        const usersWithStatus = data.map((user: ConnectedUser) => ({
          ...user,
          status: "offline" as const
        }));
        setConnectedUsers(usersWithStatus);
      } catch {
        setConnectedUsers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchConnections();
  }, [session]);

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
                      {/* Online status indicator */}
                      {user.status === "online" && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#22304a]"></div>
                      )}
                    </div>
                    <div className="flex-1">
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
              <GroupChatRoom group={selectedGroup}/>
            ) : selectedUser ? (
              <UserChatRoom selectedUser={selectedUser} onUpdateLastMessage={handleUpdateLastMessage}/>
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
