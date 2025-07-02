"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface ConnectedUser {
  _id: string;
  username: string;
  profileImage?: string;
  lastMessage?: string;
}

export default function HomePage() {
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const {data: session} = useSession();

useEffect(() => {
  if (!session?.user?.id) {
    console.log("userId not available yet");
    return;
  }

  const userId = session.user.id; // NOW safe to use

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


  return (
    <>
      <div className="grid grid-cols-[1fr_2fr] gap-2 h-screen">
        {/* 1st grid */}
        <div className="border-1 border-white">
          <div className="flex mt-3">
            <h1 className="font-semibold text-3xl">Chats</h1>
            <button className="ml-auto bg-[#2b4a7b] text-white px-2 py-auto rounded">
              New Chat
            </button>
          </div>

          {/* Users which are connected */}
          <div className="mt-6">
            <h2 className="font-semibold text-lg mb-2">Connected Users</h2>
            {loading ? (
              <div className="text-gray-400">Loading...</div>
            ) : connectedUsers.length === 0 ? (
              <div className="text-gray-400">No connections yet.</div>
            ) : (
              <ul className="space-y-3">
                {connectedUsers.map((user) => (
                  <li
                    key={user._id}
                    className="flex items-center gap-3 bg-[#181a20] rounded p-2"
                  >
                    <Image
                      src={user.profileImage || "/default_pfp.jpg"}
                      alt={user.username}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium">{user.username}</div>
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
        <div className="border-1 border-white">Column 2 (2fr)</div>
      </div>
    </>
  );
}
