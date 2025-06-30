import React, { useRef, useState } from "react";
import Image from "next/image";
import default_pfp from "@/public/default_pfp.jpg";
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
  const [preview, setPreview] = useState<string>(user.profileImage || "");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle text/textarea changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle tech stacks as comma separated
  const handleTechStacks = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      techStacks: e.target.value.split(",").map((t) => t.trim()),
    }));
  };

  // Handle image selection (just preview and store file)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // Handle form submit: upload image (if any), delete old image, then save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let newImageUrl = form.profileImage;

    // If a new image is selected, upload it and delete the old one
    if (selectedFile) {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Upload new image
      const uploadRes = await fetch("/api/imageUpload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      newImageUrl = uploadData.urls?.[0];

      // Delete previous image if exists and is not default
      if (user.profileImage && !user.profileImage.includes("default_pfp")) {
        await fetch("/api/imageDelete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: user.profileImage }),
        });
      }
    }

    await onSave({ ...form, profileImage: newImageUrl });
    setUploading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#23272f] p-6 rounded-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        <button className="absolute top-2 right-4 text-xl" onClick={onClose}>
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
        {/* Profile Image Upload Section */}
        <div className="flex flex-col items-center mb-4">
          <div
            className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-blue-700 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            title="Change profile image"
          >
            <Image
              src={preview || default_pfp}
              alt="Profile"
              fill
              style={{ objectFit: "cover" }}
            />
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <button
            type="button"
            className="mt-2 text-blue-500 underline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            Change Image
          </button>
        </div>
        {/* Profile Edit Form */}
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
          {uploading ? (
            <div className="w-full flex justify-center py-2">
              <svg
                className="animate-spin h-7 w-7 text-blue-700"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full bg-blue-700 text-white p-2 rounded mt-2"
            >
              Save Changes
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
