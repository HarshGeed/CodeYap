import React, { useState } from "react";
import { UserProfile } from "@/app/(frontend)/profile/[id]/page"; // Adjust import if needed

interface EditProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Partial<UserProfile>) => Promise<void>;
}

export default function EditProfileModal({
  user,
  isOpen,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const [form, setForm] = useState<Partial<UserProfile>>(user);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTechStacks = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      techStacks: e.target.value.split(",").map((t) => t.trim()),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#23272f] p-8 rounded-xl w-full max-w-lg relative">
        <button className="absolute top-2 right-4 text-xl" onClick={onClose}>
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="w-full p-2 rounded bg-[#181a20] text-white"
            name="username"
            value={form.username || ""}
            onChange={handleChange}
            placeholder="Username"
            required
          />
          <input
            className="w-full p-2 rounded bg-[#181a20] text-white"
            name="profileImage"
            value={form.profileImage || ""}
            onChange={handleChange}
            placeholder="Profile Image URL"
          />
          <input
            className="w-full p-2 rounded bg-[#181a20] text-white"
            name="linkedin"
            value={form.linkedin || ""}
            onChange={handleChange}
            placeholder="LinkedIn URL"
          />
          <input
            className="w-full p-2 rounded bg-[#181a20] text-white"
            name="github"
            value={form.github || ""}
            onChange={handleChange}
            placeholder="GitHub URL"
          />
          <textarea
            className="w-full p-2 rounded bg-[#181a20] text-white"
            name="bio"
            value={form.bio || ""}
            onChange={handleChange}
            placeholder="Bio"
            maxLength={160}
          />
          <textarea
            className="w-full p-2 rounded bg-[#181a20] text-white"
            name="about"
            value={form.about || ""}
            onChange={handleChange}
            placeholder="About"
            maxLength={1000}
          />
          <input
            className="w-full p-2 rounded bg-[#181a20] text-white"
            name="location"
            value={form.location || ""}
            onChange={handleChange}
            placeholder="Location"
          />
          <input
            className="w-full p-2 rounded bg-[#181a20] text-white"
            name="techStacks"
            value={form.techStacks?.join(", ") || ""}
            onChange={handleTechStacks}
            placeholder="Tech Stacks (comma separated)"
          />
          <button
            type="submit"
            className="w-full bg-blue-700 text-white p-2 rounded mt-2"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}