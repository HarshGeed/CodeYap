"use client";
import default_pfp from "@/public/default_pfp.jpg";
import Image from "next/image";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import EditProfileModal from "@/components/EditProfileModal";

interface UserProfile {
  _id: string;
  username: string;
  profileImage?: string;
  email: string;
  linkedin?: string;
  github?: string;
  bio?: string;
  about?: string;
  location?: string;
  techStacks?: string[];
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session } = useSession();
  const { id: profileUserId } = React.use(params);
  const loggedInUserId = session?.user?.id;
  const isOwnProfile = loggedInUserId === profileUserId;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [requestStatus, setRequestStatus] = useState<
    "none" | "requested" | "connected"
  >("none");

  const handleSave = async (updated: Partial<UserProfile>) => {
    const res = await fetch(`/api/updateProfile/${profileUserId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      const updatedUser = await res.json();
      setUser(updatedUser);
    }
  };

  const handleConnect = async () => {
    setRequestStatus("requested");
    await fetch("/api/notifications/sendInvite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toUserId: profileUserId,
        fromUserId: loggedInUserId,
        fromUsername: session?.user?.name,
      }),
    });
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/fetchProfle/${profileUserId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error((await res.json()).error || "Failed to fetch user");
        }
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [profileUserId]);

  if (loading) {
    return <div className="mx-[11rem] mt-10">Loading...</div>;
  }

  if (error || !user) {
    return (
      <div className="mx-[11rem] mt-10 text-red-500">
        Error: {error || "User not found"}
      </div>
    );
  }

  return (
    <div className="mx-[8rem] mt-10 mb-6">
      <div className="grid grid-cols-[1fr_2fr] gap-5">
        {/* 1st grid */}
        <div className="bg-[#1e2024] p-6 rounded-2xl">
          {/* Profile Image */}
          <div className="h-[13rem] w-[13rem] bg-[#41403e] rounded-full relative mx-auto">
            <Image
              src={user.profileImage || default_pfp}
              alt="Profile pic"
              fill
              style={{ objectFit: "cover", borderRadius: "9999px" }}
            />
          </div>
          <div className="mt-6">
            <p className="font-medium text-2xl">{user.username}</p>
            <p className="text-sm opacity-80">{user.email}</p>

            {/* if user is viewing then edit profile button else connect button  */}
            {isOwnProfile ? (
              <>
                <button
                  className="p-2 rounded-xl bg-blue-700 text-white mt-4 w-full"
                  onClick={() => setModalOpen(true)}
                >
                  Edit Profile
                </button>
                <EditProfileModal
                  user={user}
                  isOpen={modalOpen}
                  onClose={() => setModalOpen(false)}
                  onSave={handleSave}
                />
              </>
            ) : requestStatus === "requested" ? (
              <button
                className="p-2 rounded-xl bg-gray-500 text-white mt-4 w-full"
                disabled
              >
                Requested
              </button>
            ) : (
              <button
                className="p-2 rounded-xl bg-green-700 text-white mt-4 w-full"
                onClick={handleConnect}
              >
                Connect
              </button>
            )}

            <p className="mt-5">{user.bio || "No bio provided."}</p>
            <div className="flex mt-4 opacity-80">
              <MapPin />
              <p className="ml-2">{user.location || "No location provided."}</p>
            </div>
            {user.linkedin && (
              <Link href={user.linkedin} target="_blank">
                <button className="p-2 rounded-xl bg-blue-950 mt-3 w-full">
                  LinkedIn
                </button>
              </Link>
            )}
            {user.github && (
              <Link href={user.github} target="_blank">
                <button className="p-2 rounded-xl bg-gray-800 mt-3 w-full">
                  Github
                </button>
              </Link>
            )}
          </div>
        </div>
        {/* 2nd grid */}
        <div className="bg-[#161719] p-6 rounded-2xl">
          <h1 className="text-3xl font-semibold">🤵 About Me :</h1>
          <hr className="mt-4 opacity-50" />
          <p className="mt-5">{user.about || "No about info provided."}</p>

          <h1 className="text-3xl font-semibold mt-5">💻 Tech Stacks :</h1>
          <hr className="mt-4 opacity-50" />
          <div className="mt-5 flex flex-wrap gap-2">
            {user.techStacks && user.techStacks.length > 0 ? (
              user.techStacks.map((tech, idx) => (
                <span
                  key={idx}
                  className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm"
                >
                  {tech}
                </span>
              ))
            ) : (
              <span className="text-gray-400">No tech stacks provided.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
