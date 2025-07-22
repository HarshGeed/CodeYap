"use client";
import default_pfp from "@/public/default_pfp.jpg";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import GroupEditModal from "@/components/GroupEditModal";
import { useRouter } from "next/navigation";

interface GroupMember {
  _id: string;
  username: string;
  profileImage?: string;
}

interface GroupProfile {
  _id: string;
  name: string;
  description?: string;
  profileImage?: string;
  members: GroupMember[];
  admin: GroupMember;
}

export default function GroupProfilePage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const groupId = params.id;
  const [group, setGroup] = useState<GroupProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [changeAdminOpen, setChangeAdminOpen] = useState(false);
  const [changingAdmin, setChangingAdmin] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [removingMember, setRemovingMember] = useState<string>("");
  const [leaving, setLeaving] = useState(false);

  const isMember = Boolean(group && session?.user?.id && group.members.some(m => m._id === session?.user?.id));
  const isAdmin = Boolean(group && session?.user?.id && group.admin._id === session?.user?.id);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/groups/${groupId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error((await res.json()).error || "Failed to fetch group");
        }
        return res.json();
      })
      .then((data) => {
        setGroup(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [groupId]);

  // Leave group handler
  const handleLeaveGroup = async () => {
    if (!session?.user?.id || !group) return;
    setLeaving(true);
    const res = await fetch(`/api/groups/leave/${group._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.user.id }),
    });
    setLeaving(false);
    if (res.ok) {
      router.push("/profile/" + session.user.id); // Go to user profile after leaving
    }
  };

  // Remove member handler
  const handleRemoveMember = async (memberId: string) => {
    if (!session?.user?.id || !group) return;
    setRemovingMember(memberId);
    const res = await fetch(`/api/groups/remove-member/${group._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId: session.user.id, memberId }),
    });
    setRemovingMember("");
    if (res.ok) {
      const data = await res.json();
      setGroup(data.group);
    }
  };

  // Change admin handler
  const handleChangeAdmin = async () => {
    if (!session?.user?.id || !group || !selectedAdmin) return;
    setChangingAdmin(true);
    const res = await fetch(`/api/groups/change-admin/${group._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId: session.user.id, newAdminId: selectedAdmin }),
    });
    setChangingAdmin(false);
    setChangeAdminOpen(false);
    setSelectedAdmin("");
    if (res.ok) {
      const data = await res.json();
      setGroup(data.group);
    }
  };

  if (loading) {
    return <div className="mx-[11rem] mt-10">Loading...</div>;
  }

  if (error || !group) {
    return (
      <div className="mx-[11rem] mt-10 text-red-500">
        Error: {error || "Group not found"}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl mt-10 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8">
        {/* 1st grid */}
        <div className="bg-[#1e2024] p-8 rounded-3xl shadow-lg flex flex-col items-center">
          {/* Group Image */}
          <div className="h-48 w-48 bg-[#41403e] rounded-full relative overflow-hidden shadow-lg border-4 border-blue-700">
            <Image
              src={group.profileImage || default_pfp}
              alt="Group pic"
              fill
              style={{ objectFit: "cover", borderRadius: "9999px" }}
            />
          </div>
          <div className="mt-8 w-full text-center">
            <p className="font-bold text-3xl text-white mb-2">{group.name}</p>
            <p className="text-base text-[#60a5fa] mb-4">{group.members.length} members</p>
            {isMember && (
              <>
                <button
                  className="p-2 rounded-xl bg-blue-700 text-white mt-2 w-full hover:bg-blue-800 transition"
                  onClick={() => setModalOpen(true)}
                >
                  Edit Group
                </button>
                <GroupEditModal
                  group={group}
                  isOpen={modalOpen}
                  onClose={() => setModalOpen(false)}
                  onSave={async (updated) => {
                    if (!session?.user?.id) return;
                    const res = await fetch(`/api/groups/update/${group._id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId: session.user.id,
                        ...updated,
                      }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setGroup(data.group);
                    }
                  }}
                />
                <button
                  className="p-2 rounded-xl bg-red-600 text-white mt-2 w-full hover:bg-red-700 transition"
                  onClick={handleLeaveGroup}
                  disabled={leaving}
                >
                  {leaving ? "Leaving..." : "Leave Group"}
                </button>
              </>
            )}
            {isAdmin && (
              <button
                className="p-2 rounded-xl bg-green-700 text-white mt-2 w-full hover:bg-green-800 transition"
                onClick={() => setChangeAdminOpen(true)}
              >
                Change Admin
              </button>
            )}
            <p className="mt-8 text-lg text-[#e0e7ef] bg-[#23272f] rounded-xl p-4 shadow-inner min-h-[5rem]">
              {group.description || "No description provided."}
            </p>
          </div>
        </div>
        {/* 2nd grid: Members list */}
        <div className="bg-[#161719] p-8 rounded-3xl shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-4 flex items-center gap-2">👥 Members</h1>
          <hr className="mb-6 opacity-30" />
          <div className="flex flex-col gap-4">
            {group.members.map((member) => (
              <div
                key={member._id}
                className="flex items-center gap-4 bg-[#23272f] rounded-xl p-3 hover:shadow-lg transition group"
              >
                <Link
                  href={`/profile/${member._id}`}
                  className="flex items-center gap-4 flex-1"
                >
                  <div className="h-12 w-12 rounded-full bg-[#41403e] relative overflow-hidden border-2 border-[#60a5fa] group-hover:border-blue-700 transition">
                    <Image
                      src={member.profileImage || default_pfp}
                      alt={member.username}
                      fill
                      style={{ objectFit: "cover", borderRadius: "9999px" }}
                    />
                  </div>
                  <span className="font-semibold text-lg text-white group-hover:text-[#60a5fa] transition">{member.username}</span>
                  {group.admin._id === member._id && (
                    <span className="ml-2 px-2 py-1 bg-blue-700 text-white text-xs rounded-full">Admin</span>
                  )}
                </Link>
                {isAdmin && member._id !== session?.user?.id && (
                  <button
                    className="ml-2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    onClick={() => handleRemoveMember(member._id)}
                    disabled={removingMember === member._id}
                  >
                    {removingMember === member._id ? "Removing..." : "Remove"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Change Admin Modal */}
      {changeAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#23272f] p-8 rounded-xl w-full max-w-md relative">
            <button className="absolute top-2 right-4 text-xl" onClick={() => setChangeAdminOpen(false)}>
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4 text-white">Change Admin</h2>
            <div className="flex flex-col gap-3">
              {group.members.filter(m => m._id !== group.admin._id).map((member) => (
                <button
                  key={member._id}
                  className={`flex items-center gap-3 p-2 rounded-lg w-full text-left hover:bg-blue-900 transition ${selectedAdmin === member._id ? "bg-blue-800" : "bg-[#181a20]"}`}
                  onClick={() => setSelectedAdmin(member._id)}
                  disabled={changingAdmin}
                >
                  <div className="h-8 w-8 rounded-full bg-[#41403e] relative overflow-hidden">
                    <Image
                      src={member.profileImage || default_pfp}
                      alt={member.username}
                      fill
                      style={{ objectFit: "cover", borderRadius: "9999px" }}
                    />
                  </div>
                  <span className="font-medium text-white">{member.username}</span>
                  {selectedAdmin === member._id && <span className="ml-auto text-xs text-[#60a5fa]">Selected</span>}
                </button>
              ))}
            </div>
            <button
              className="mt-6 w-full bg-green-700 text-white p-2 rounded-lg hover:bg-green-800 transition"
              onClick={handleChangeAdmin}
              disabled={changingAdmin || !selectedAdmin}
            >
              {changingAdmin ? "Changing..." : "Change Admin"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 