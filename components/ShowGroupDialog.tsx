import React, { useState } from "react";
import Image from "next/image";
import default_pfp from "@/public/default_pfp.jpg";

interface ConnectedUser {
  _id: string;
  username: string;
  profileImage?: string;
}

interface ShowGroupDialogProps {
  open: boolean;
  onClose: () => void;
  connectedUsers: ConnectedUser[];
  onCreate: (groupName: string, memberIds: string[]) => Promise<void>;
  loading?: boolean;
}

const ShowGroupDialog: React.FC<ShowGroupDialogProps> = ({
  open,
  onClose,
  connectedUsers,
  onCreate,
  loading = false,
}) => {
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  if (!open) return null;

  const handleToggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    await onCreate(groupName, selectedMembers);
    setGroupName("");
    setSelectedMembers([]);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-[#18181b] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-[#232323]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <input
            className="w-full px-4 py-2 rounded-lg bg-[#232323] text-[#fafafa] placeholder:text-[#52525b] border border-[#232323] focus:outline-none focus:ring-2 focus:ring-[#232323] transition"
            placeholder="Name the group"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>
        <div className="mb-4 max-h-60 overflow-y-auto">
          <div className="text-[#a1a1aa] mb-2">Select members:</div>
          <ul>
            {connectedUsers.map((user) => (
              <li
                key={user._id}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                  selectedMembers.includes(user._id)
                    ? "bg-[#232323]"
                    : "hover:bg-[#232323]"
                }`}
                onClick={() => handleToggleMember(user._id)}
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(user._id)}
                  readOnly
                  className="accent-[#232323]"
                />
                <div className="h-8 w-8 bg-[#232323] rounded-full relative border border-[#232323]">
                  <Image
                    src={user.profileImage || default_pfp}
                    alt="Profile pic"
                    fill
                    style={{ objectFit: "cover", borderRadius: "9999px" }}
                  />
                </div>
                <div className="font-medium text-base text-[#fafafa]">
                  {user.username}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-[#232323] text-[#fafafa] hover:bg-[#27272a] border border-[#232323]"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
            disabled={
              !groupName.trim() || selectedMembers.length === 0 || loading
            }
            onClick={handleCreate}
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShowGroupDialog;