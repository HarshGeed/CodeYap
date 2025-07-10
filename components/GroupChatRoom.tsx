"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import default_pfp from "@/public/default_pfp.jpg";
import { useSession } from "next-auth/react";
import { Paperclip } from "lucide-react";

interface GroupChatRoomProps {
  group: {
    _id: string;
    name: string;
    members: { _id: string; username: string; profileImage?: string }[];
  };
}

interface GroupMessage {
  _id?: string;
  groupId: string;
  senderId: string;
  senderName?: string;
  senderImage?: string;
  message: string;
  timestamp: string;
  fileType?: string;
}

export default function GroupChatRoom({ group }: GroupChatRoomProps) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const [uploading, setUploading] = useState(false);
  const [modalMedia, setModalMedia] = useState<{
    type: string;
    src: string;
  } | null>(null);
  const [modalLoading, setModalLoading] = useState(true);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

  function fileTypeFromUrl(url: string) {
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return "image";
    if (url.match(/\.(mp4|webm|ogg|mov)$/i)) return "video";
    if (url.match(/\.(pdf|docx?|pptx?|xlsx?|txt)$/i)) return "document";
    return "file";
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  if (files.length > 8) {
    alert("You can only send a maximum of 8 files at a time.");
    setUploading(false);
    setUploadPercent(null);
    e.target.value = "";
    return;
  }

  setUploading(true);
  setUploadPercent(0);

  const formData = new FormData();
  for (const file of Array.from(files)) {
    formData.append("file", file);
  }

  try {
    // Use XMLHttpRequest for progress
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/imageUpload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadPercent(percent);
      }
    };

    xhr.onload = async () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        if (data.urls && Array.isArray(data.urls)) {
          for (const url of data.urls) {
            const msgObj: GroupMessage = {
              groupId: group._id,
              senderId: session?.user?.id,
              senderName: session?.user?.username,
              senderImage: session?.user?.profileImage,
              message: url,
              timestamp: new Date().toISOString(),
              fileType: fileTypeFromUrl(url),
            };
            socketRef.current.emit("send-group-message", msgObj);
            await fetch("/api/group-messages/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(msgObj),
            });
          }
        }
      } else {
        alert("File upload failed.");
      }
      setUploading(false);
      setUploadPercent(null);
      e.target.value = "";
    };

    xhr.onerror = () => {
      alert("File upload failed.");
      setUploading(false);
      setUploadPercent(null);
      e.target.value = "";
    };

    xhr.send(formData);
  } catch (error) {
    alert("File upload failed.");
    setUploading(false);
    setUploadPercent(null);
    e.target.value = "";
  }
};

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

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

  // Scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!group?._id || !session?.user?.id) return;

    import("@/lib/socket").then(({ connectSocket }) => {
      if (!socketRef.current) {
        socketRef.current = connectSocket();
      }

      const socket = socketRef.current;

      socket.emit("join-group", group._id);

      fetch(`/api/group-messages/get/${group._id}`)
        .then((res) => res.json())
        .then(setMessages);

      // Remove any previous handler before adding a new one
      socket.off("receive-group-message");
      const handler = (msg: GroupMessage) => {
        if (msg.groupId === group._id) {
          setMessages((prev) => [...prev, msg]);
        }
      };

      socket.on("receive-group-message", handler);

      return () => {
        socket.emit("leave-group", group._id);
        socket.off("receive-group-message", handler);
      };
    });
  }, [group?._id, session?.user?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const msgObj: GroupMessage = {
      groupId: group._id,
      senderId: session?.user?.id,
      senderName: session?.user?.username,
      senderImage: session?.user?.profileImage,
      message: newMessage,
      timestamp: new Date().toISOString(),
    };

    socketRef.current.emit("send-group-message", msgObj);

    await fetch("/api/group-messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msgObj),
    });

    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Group Header */}
      <div className="flex items-center gap-4 px-4 pt-4 pb-2 border-b border-[#22304a]/30">
        <div className="h-12 w-12 bg-[#22304a] rounded-full flex items-center justify-center text-[#60a5fa] font-bold text-2xl">
          {group.name[0]}
        </div>
        <div>
          <div className="font-bold text-xl text-[#c0cad6]">{group.name}</div>
          <div className="text-xs text-[#60a5fa]/80">
            {group.members.length} members
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 rounded">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-center mt-10">
            No messages yet.
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const msgDate = new Date(msg.timestamp).toDateString();
              const showDate =
                idx === 0 ||
                msgDate !==
                  new Date(messages[idx - 1].timestamp).toDateString();
              const isOwn = msg.senderId === session.user.id;
              const isGroupStart =
                idx === 0 || msg.senderId !== messages[idx - 1].senderId;

              // Detect file type if not present
              const type = msg.fileType || fileTypeFromUrl(msg.message);

              return (
                <div key={msg._id || idx}>
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
                    <div className="flex items-end gap-2 max-w-[70%]">
                      {/* Avatar or placeholder for alignment */}
                      {!isOwn &&
                        (isGroupStart ? (
                          <div className="h-8 w-8 rounded-full bg-[#232323] relative flex-shrink-0">
                            <Image
                              src={msg.senderImage || default_pfp}
                              alt="Profile pic"
                              fill
                              style={{
                                objectFit: "cover",
                                borderRadius: "9999px",
                              }}
                            />
                          </div>
                        ) : (
                          // Empty space for alignment
                          <div className="h-8 w-8" />
                        ))}
                      <div>
                        <span
                          className={`inline-block px-4 py-2 rounded-2xl shadow ${
                            isOwn
                              ? "bg-[#3f495f] text-white rounded-br-sm"
                              : "bg-[#22304a] text-[#e0e7ef] rounded-bl-sm"
                          }`}
                        >
                          {/* Show name inside bubble for group start (or single message) */}
                          {!isOwn && isGroupStart && (
                            <span className="block text-xs font-semibold text-[#60a5fa] mb-1">
                              {msg.senderName}
                            </span>
                          )}
                          {/* Render file or text */}
                          {type === "image" ? (
                            <div
                              className="cursor-pointer"
                              onClick={() => {
                                setModalLoading(true);
                                setModalMedia({
                                  type: "image",
                                  src: msg.message,
                                });
                              }}
                            >
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
                                  maxWidth: "20rem",
                                  maxHeight: "15rem",
                                  width: "100%",
                                  height: "auto",
                                }}
                                className="rounded-lg"
                              />
                            </div>
                          ) : type === "video" ? (
                            <video
                              src={msg.message}
                              controls
                              className="max-w-md max-h-[22rem] rounded-lg"
                              width={400}
                              height={320}
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
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
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
          {uploading
    ? uploadPercent !== null
      ? `${uploadPercent}%`
      : "Uploading..."
    : <Paperclip />}
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
      {modalMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
          onClick={() => setModalMedia(null)}
        >
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            {modalLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {modalMedia.type === "image" ? (
              <Image
                src={modalMedia.src}
                alt="expanded"
                width={1200}
                height={900}
                className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg object-contain"
                style={{ width: "auto", height: "auto" }}
                onLoadingComplete={() => setModalLoading(false)}
              />
            ) : (
              <video
                src={modalMedia.src}
                controls
                autoPlay
                className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg bg-black"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
