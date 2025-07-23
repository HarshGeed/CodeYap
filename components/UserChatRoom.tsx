"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Paperclip, Download, Copy, Maximize2, Minimize2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { connectSocket, registerUser } from "@/lib/socket";
import Link from "next/link";
import MonacoEditor from "@monaco-editor/react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

// Fix CodeMessage export
function CodeMessage({ code, language }: { code: string; language: string }) {
  return (
    <SyntaxHighlighter language={language} style={oneDark} wrapLongLines>
      {code}
    </SyntaxHighlighter>
  );
}

interface User {
  _id: string;
  username: string;
  profileImage?: string;
  status?: "online" | "offline";
  lastSeen?: string;
}

interface Message {
  _id?: string;
  roomId: string;
  message: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  fileType?: string;
  originalName?: string;
  sender?: string;
  seenBy?: string[];
  contentType?: string;
  code?: {
    language: string;
    content: string;
  };
}

interface UserChatRoomProps {
  selectedUser: User;
  onUpdateLastMessage: (userId: string, message: string) => void;
}

interface Socket {
  emit: (event: string, data: unknown) => void;
  on: (event: string, handler: (data: unknown) => void) => void;
  off: (event: string, handler: (data: unknown) => void) => void;
}

// @ts-expect-error No types for react-syntax-highlighter
declare module 'react-syntax-highlighter';
// @ts-expect-error No types for react-syntax-highlighter prism styles
declare module 'react-syntax-highlighter/dist/cjs/styles/prism';

export default function UserChatRoom({ selectedUser, onUpdateLastMessage }: UserChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const [modalMedia, setModalMedia] = useState<{ type: string; src: string } | null>(null);
  const [modalLoading, setModalLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [seenMessageIds, setSeenMessageIds] = useState<Set<string>>(new Set());
  const [codeMode, setCodeMode] = useState(false);
  const [codeContent, setCodeContent] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Local state for user status and lastSeen
  const [userStatus, setUserStatus] = useState<{ status: string; lastSeen?: string }>({
    status: selectedUser.status || "offline",
    lastSeen: selectedUser.lastSeen,
  });

  // Update local status state when selectedUser changes
  useEffect(() => {
    setUserStatus({
      status: selectedUser.status || "offline",
      lastSeen: selectedUser.lastSeen,
    });
  }, [selectedUser]);

  // Listen for user status updates
  useEffect(() => {
    if (!socketRef.current) return;
    const handler = (data: unknown) => {
      const { userId, status, lastSeen } = data as { userId: string; status: string; lastSeen?: string };
      console.log("UserChatRoom received status update:", { userId, status, lastSeen, selectedUserId: selectedUser._id });
      if (userId === selectedUser._id) {
        console.log("Updating user status in UserChatRoom:", { status, lastSeen });
        setUserStatus({ status, lastSeen });
      }
    };
    socketRef.current.on("user-status", handler);
    return () => socketRef.current?.off("user-status", handler);
  }, [selectedUser]);

  // Listen for typing events
  useEffect(() => {
    if (!socketRef.current || !selectedUser || !session?.user?.id) return;

    const typingHandler = (data: unknown) => {
      const typedData = data as { roomId: string; userId: string };
      if (
        session.user?.id &&
        typedData.roomId === getRoomId(session.user.id, selectedUser._id) &&
        typedData.userId === selectedUser._id
      ) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    };

    socketRef.current.on("typing", typingHandler);

    return () => {
      socketRef.current?.off("typing", typingHandler);
    };
  }, [selectedUser, session?.user?.id]);

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

  // Helper to get consistent roomId
  const getRoomId = (userId1: string, userId2: string) =>
    [userId1, userId2].sort().join("_");

  // Helper to guess file type from URL
  function fileTypeFromUrl(url: string | undefined | null) {
    if (!url || typeof url !== "string") return "file";
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return "image";
    if (url.match(/\.(mp4|webm|ogg|mov)$/i)) return "video";
    if (url.match(/\.(pdf|docx?|pptx?|xlsx?|txt)$/i)) return "document";
    return "file";
  }

  // Scroll to bottom when messages change and emit seen status
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
    
    // Emit seen status for messages when they become visible
    if (messages.length > 0 && session?.user?.id && selectedUser && socketRef.current) {
      const unreadMessages = messages.filter(
        (msg) =>
          msg.receiverId === session?.user?.id &&
          msg.senderId === selectedUser._id &&
          msg._id &&
          !seenMessageIds.has(msg._id)
      );
      
      if (unreadMessages.length > 0) {
        console.log("Emitting seen on message visibility for", unreadMessages.length, "messages");
        unreadMessages.forEach((msg) => {
          socketRef.current?.emit("message-seen", {
            roomId: msg.roomId,
            messageId: msg._id,
            seenBy: session?.user?.id,
          });
          setSeenMessageIds(prev => new Set([...prev, msg._id!]));
        });
      }
    }
  }, [messages, session?.user?.id, selectedUser, seenMessageIds]);

  // Connect socket once
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = connectSocket();
    }
    
    // Register user for status tracking
    if (session?.user?.id) {
      registerUser(session.user.id);
    }
    
    // Handle reconnection
    const handleReconnect = () => {
      console.log("Socket reconnected, re-emitting seen status");
      if (selectedUser && session?.user?.id && messages.length > 0) {
        const unreadMessages = messages.filter(
          (msg) =>
            msg.receiverId === session?.user?.id &&
            msg.senderId === selectedUser._id &&
            msg._id
        );
        
        unreadMessages.forEach((msg) => {
          console.log("Re-emitting seen on reconnect for message:", msg._id);
          socketRef.current?.emit("message-seen", {
            roomId: msg.roomId,
            messageId: msg._id,
            seenBy: session?.user?.id,
          });
        });
      }
    };
    
    socketRef.current?.on("connect", handleReconnect);
    
    return () => {
      socketRef.current?.off("connect", handleReconnect);
    };
  }, [session?.user?.id, selectedUser, messages]);

  // Join room and fetch messages when user is selected
  useEffect(() => {
    if (!selectedUser || !session?.user?.id) return;
    const roomId = getRoomId(session?.user?.id || "", selectedUser._id);

    // Join room
    socketRef.current?.emit("join-room", roomId);

    // Fetch chat history
    (async () => {
      const res = await fetch(`/api/messages/${roomId}`);
      const data = await res.json();
      console.log("[DEBUG] Messages fetched from backend:", data);
      setMessages(data);
      // After loading messages, emit seen for all messages from the selected user
      setTimeout(() => {
        const unreadMessages = data.filter(
          (msg: Message) =>
            msg.receiverId === session?.user?.id &&
            msg.senderId === selectedUser._id &&
            msg._id &&
            !(msg.seenBy || []).includes(session.user.id)
        );
        unreadMessages.forEach((msg: Message) => {
          // Emit seen event via socket
          socketRef.current?.emit("message-seen", {
            roomId: msg.roomId,
            messageId: msg._id,
            seenBy: session?.user?.id,
          });
          setSeenMessageIds(prev => new Set([...prev, msg._id!]));
          // Update seenBy in the database
          fetch(`/api/messages/${roomId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messageId: msg._id, userId: session.user.id }),
            }
          );
        });
      }, 100); // Small delay to ensure messages are loaded
    })();
  }, [selectedUser, session?.user?.id]);

  // Listen for new messages (global listener)
  useEffect(() => {
    if (!socketRef.current) return;

    const handler = (data: unknown) => {
      const msg = data as Message;
      if (
        selectedUser &&
        msg.roomId === getRoomId(session?.user?.id || "", selectedUser._id)
      ) {
        setMessages((prev) => [...prev, msg]);
        onUpdateLastMessage(selectedUser._id, msg.message);
        
        // If this is a message to the current user, emit seen immediately
        if (msg.receiverId === session?.user?.id && msg.senderId === selectedUser._id && msg._id) {
          console.log("New message received, emitting seen immediately:", msg._id);
          setTimeout(() => {
            socketRef.current?.emit("message-seen", {
              roomId: msg.roomId,
              messageId: msg._id,
              seenBy: session?.user?.id,
            });
            setSeenMessageIds(prev => new Set([...prev, msg._id!]));
          }, 100); // Small delay to ensure message is processed
        }
      }
    };

    socketRef.current.on("receive-message", handler);

    // Cleanup
    return () => {
      socketRef.current?.off("receive-message", handler);
    };
  }, [selectedUser, session?.user?.id, onUpdateLastMessage]);

    // Emit 'message-seen' for all unread messages from the selected user to the current user
  useEffect(() => {
    if (
      messages.length > 0 &&
      session?.user?.id &&
      selectedUser &&
      socketRef.current
    ) {
      // Find all unread messages from the selected user to the current user
      const unreadMessages = messages.filter(
        (msg) =>
          msg.receiverId === session?.user?.id &&
          msg.senderId === selectedUser._id &&
          msg._id &&
          !seenMessageIds.has(msg._id)
      );
      
      // Emit seen for each unread message
      unreadMessages.forEach(msg => {
        console.log("Emitting message-seen", {
          roomId: msg.roomId,
          messageId: msg._id,
          seenBy: session?.user?.id,
        });
        socketRef.current?.emit("message-seen", {
          roomId: msg.roomId,
          messageId: msg._id,
          seenBy: session?.user?.id,
        });
        // Mark as seen locally
        setSeenMessageIds(prev => new Set([...prev, msg._id!]));
      });
    }
  }, [messages, selectedUser, session?.user?.id]);

  // Clear seen messages when selected user changes
  useEffect(() => {
    setSeenMessageIds(new Set());
  }, [selectedUser._id]);

  // Periodically emit seen status to ensure synchronization
  useEffect(() => {
    if (!selectedUser || !session?.user?.id || !socketRef.current) return;
    
    const interval = setInterval(() => {
      const unreadMessages = messages.filter(
        (msg) =>
          msg.receiverId === session?.user?.id &&
          msg.senderId === selectedUser._id &&
          msg._id &&
          !seenMessageIds.has(msg._id)
      );
      
      if (unreadMessages.length > 0) {
        console.log("Periodic seen emission for", unreadMessages.length, "messages");
        unreadMessages.forEach((msg) => {
          socketRef.current?.emit("message-seen", {
            roomId: msg.roomId,
            messageId: msg._id,
            seenBy: session?.user?.id,
          });
          setSeenMessageIds(prev => new Set([...prev, msg._id!]));
        });
      }
    }, 5000); // Emit every 5 seconds
    
    return () => clearInterval(interval);
  }, [selectedUser, session?.user?.id, messages, seenMessageIds]);

  // Listen for 'message-seen' events
  useEffect(() => {
    if (!socketRef.current) return;
    type MessageSeenData = { messageId: string; seenBy: string };
    const handler = (data: unknown) => {
      const seenData = data as MessageSeenData;
      console.log("Received message-seen", seenData);
      // Only update if the current user is the sender
      if (
        seenData.seenBy === selectedUser._id &&
        session?.user?.id === messages.find(m => m._id === seenData.messageId)?.senderId
      ) {
        setSeenMessageIds(prev => new Set([...prev, seenData.messageId]));
      }
    };
    socketRef.current.on("message-seen", handler);
    return () => socketRef.current?.off("message-seen", handler);
  }, [selectedUser, session?.user?.id, messages]);

  // Handle page unload to update lastSeen and window focus for seen status
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session?.user?.id) {
        // Use sendBeacon for reliable delivery during page unload
        navigator.sendBeacon(`/api/updateLastSeen/${session.user.id}`);
      }
    };

    const handleWindowFocus = () => {
      // When window gains focus, emit seen for all unread messages
      if (selectedUser && session?.user?.id && socketRef.current && messages.length > 0) {
        const unreadMessages = messages.filter(
          (msg) =>
            msg.receiverId === session?.user?.id &&
            msg.senderId === selectedUser._id &&
            msg._id &&
            !seenMessageIds.has(msg._id)
        );
        
        if (unreadMessages.length > 0) {
          console.log("Window focused, emitting seen for", unreadMessages.length, "messages");
          unreadMessages.forEach((msg) => {
            socketRef.current?.emit("message-seen", {
              roomId: msg.roomId,
              messageId: msg._id,
              seenBy: session?.user?.id,
            });
            setSeenMessageIds(prev => new Set([...prev, msg._id!]));
          });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [session?.user?.id, selectedUser, messages, seenMessageIds]);

  const handleSendMessage = async () => {
    if (codeMode) {
      if (!codeContent.trim() || !selectedUser || !session?.user?.id) return;
      const roomId = getRoomId(session?.user?.id || "", selectedUser._id);
      const msgObj = {
        roomId,
        senderId: session?.user?.id || "",
        receiverId: selectedUser._id,
        timestamp: new Date().toISOString(),
        contentType: "code",
        code: {
          language: codeLanguage,
          content: codeContent,
        },
      };
      // Save to backend and get the message with _id
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msgObj),
      });
      const savedMsg = await res.json();
      console.log("[DEBUG] Message sent and saved:", savedMsg);
      socketRef.current?.emit("send-message", savedMsg);
      setCodeContent("");
      setCodeMode(false);
      onUpdateLastMessage(selectedUser._id, "[code]");
      return;
    }
    if (!newMessage.trim() || !selectedUser || !session?.user?.id) return;
    const roomId = getRoomId(session?.user?.id || "", selectedUser._id);
    const msgObj = {
      roomId,
      message: newMessage,
      senderId: session?.user?.id || "",
      receiverId: selectedUser._id,
      timestamp: new Date().toISOString(),
    };

    // Save to backend and get the message with _id
    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msgObj),
    });
    const savedMsg = await res.json();
    console.log("[DEBUG] Message sent and saved:", savedMsg);

    // Emit via socket (do NOT add to state here)
    socketRef.current?.emit("send-message", savedMsg);

    setNewMessage("");
    onUpdateLastMessage(selectedUser._id, newMessage);
  };

  // Handle file upload and send as message
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
      formData.append("file", file, file.name);
    }

    try {
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
            for (const fileObj of data.urls) {
              const roomId = getRoomId(session?.user?.id || "", selectedUser._id);
              const msgObj: Message = {
                roomId,
                message: fileObj.url,
                senderId: session?.user?.id || "",
                receiverId: selectedUser._id,
                timestamp: new Date().toISOString(),
                fileType: fileTypeFromUrl(fileObj.url),
                originalName: fileObj.originalName,
              };
              setMessages((prev) => [...prev, msgObj]);
              socketRef.current?.emit("send-message", msgObj);
              await fetch("/api/messages/send", {
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
    } catch {
      alert("File upload failed.");
      setUploading(false);
      setUploadPercent(null);
      e.target.value = "";
    }
  };

  // Copy code to clipboard
  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1200);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with profile image, username, and status */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Image
          src={selectedUser.profileImage || "/default_pfp.jpg"}
          alt={selectedUser.username}
          width={46}
          height={46}
          className="rounded-full aspect-square object-cover border border-[#2563eb]"
        />
        <div className="flex flex-col">
          <Link href={`/profile/${selectedUser._id}`}>
          <span className="font-bold text-xl text-[#c0cad6] tracking-wide">
            {selectedUser.username}
          </span>
          </Link>
          <span className="text-xs text-[#60a5fa]">
            {isTyping
              ? "typing..."
              : userStatus.status === "online"
              ? "Online"
              : userStatus.lastSeen
              ? `Last seen ${formatDate(userStatus.lastSeen)} ${formatTime(userStatus.lastSeen)}`
              : "Offline"}
          </span>
        </div>
      </div>
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 rounded">
        {messages.map((msg, idx) => {
          const msgDate = new Date(msg.timestamp).toDateString();
          const showDate =
            idx === 0 || msgDate !== new Date(messages[idx - 1].timestamp).toDateString();
          const isOwn = (msg.sender || msg.senderId) === (session?.user?.id ?? "");
          const type = msg.fileType || fileTypeFromUrl(msg.message);

          // Render code message
          if (msg.contentType === "code" && msg.code) {
            return (
              <div key={idx}>
                {showDate && (
                  <div className="flex justify-center my-2">
                    <span className="bg-[#22304a] text-[#60a5fa] text-xs px-4 py-1 rounded-full shadow my-3">
                      {formatDate(msg.timestamp)}
                    </span>
                  </div>
                )}
                <div className={`mb-2 flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <span className={`relative max-w-[70%] break-words px-3 py-2 rounded-lg shadow ${isOwn ? "bg-[#3f495f] text-white rounded-br-sm" : "bg-[#22304a] text-[#e0e7ef] rounded-bl-sm"}`}>
                    {/* Copy button */}
                    <button
                      className="absolute top-2 right-2 p-1 bg-[#171b24] rounded hover:bg-[#2563eb] transition text-[#60a5fa] text-xs flex items-center"
                      style={{ zIndex: 2 }}
                      onClick={() => handleCopyCode(msg.code.content, idx)}
                      title="Copy code"
                    >
                      <Copy size={14} />
                      {copiedIdx === idx && (
                        <span className="ml-1 text-green-400 text-xs">Copied!</span>
                      )}
                    </button>
                    <CodeMessage code={msg.code.content} language={msg.code.language} />
                    <span className="inline-block text-[11px] text-[#93c5fd] mt-1 text-right pl-2 ">
                      {formatTime(msg.timestamp)}
                      {isOwn && msg._id && seenMessageIds.has(msg._id) && (
                        <span className="text-xs text-blue-400 ml-2">seen</span>
                      )}
                    </span>
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div key={idx}>
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
                <span
                  className={`max-w-[70%] break-words px-3 py-2 rounded-lg shadow ${
                    isOwn
                      ? "bg-[#3f495f] text-white rounded-br-sm"
                      : "bg-[#22304a] text-[#e0e7ef] rounded-bl-sm"
                  }`}
                >
                  {/* Render file or text */}
                  {type === "image" ? (
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        setModalLoading(true);
                        setModalMedia({ type: "image", src: msg.message });
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
                    <div className="flex items-center gap-3 bg-[#22304a] rounded-lg px-3 py-2">
                      <span className="text-2xl">📄</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#60a5fa]">
                          {msg.originalName ||
                            (() => {
                              try {
                                const urlObj = new URL(msg.message);
                                return decodeURIComponent(
                                  urlObj.pathname.split("/").pop() || "Document"
                                );
                              } catch {
                                return "Document";
                              }
                            })()}
                        </span>
                      </div>
                      <a
                        href={msg.message}
                        download={msg.originalName || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-[#60a5fa] hover:text-blue-400 p-2 rounded transition"
                        title="Download"
                      >
                        <Download size={22} />
                      </a>
                    </div>
                  ) : (
                    msg.message
                  )}
                  <span className="inline-block text-[11px] text-[#93c5fd] mt-1 text-right pl-2 ">
                    {formatTime(msg.timestamp)}
                    {isOwn && msg._id && seenMessageIds.has(msg._id) && (
                      <span className="text-xs text-blue-400 ml-2">seen</span>
                    )}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {/* Input and upload */}
      {codeMode ? (
        <div className="w-full flex flex-col items-start mt-2 px-4 pb-4 rounded-2xl shadow-lg bg-[#181a20] border border-[#22304a] transition-all duration-300">
          <div className="w-full">
            <MonacoEditor
              height="260px"
              language={codeLanguage}
              value={codeContent}
              theme="vs-dark"
              onChange={(val: string | undefined) => setCodeContent(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 15,
                scrollBeyondLastLine: false,
                wordWrap: "on",
                lineNumbers: "on",
                scrollbar: { vertical: "hidden", horizontal: "hidden" },
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                overviewRulerBorder: false,
                renderLineHighlight: "none",
                folding: false,
                contextmenu: false,
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
                tabSize: 2,
                padding: { top: 8, bottom: 8 },
                theme: "vs-dark",
              }}
              className="rounded-lg border border-[#22304a] bg-[#171b24] text-[#e0e7ef]"
            />
          </div>
          <div className="w-full flex flex-row items-center gap-2 mt-2">
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
            <button
              className={`px-3 py-2 rounded-lg shadow border ${codeMode ? "bg-blue-700 text-white" : "bg-[#22304a] text-[#60a5fa]"} hover:bg-blue-800 transition`}
              onClick={() => setCodeMode((prev) => !prev)}
              type="button"
              disabled={uploading}
            >
              {codeMode ? "Text" : "Code"}
            </button>
            <select
              className="rounded-lg px-2 py-2 bg-[#171b24] text-[#e0e7ef] border border-[#22304a] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition"
              value={codeLanguage}
              onChange={(e) => setCodeLanguage(e.target.value)}
              style={{ minWidth: 100 }}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="typescript">TypeScript</option>
              <option value="go">Go</option>
              <option value="php">PHP</option>
              <option value="ruby">Ruby</option>
              <option value="rust">Rust</option>
              <option value="kotlin">Kotlin</option>
              <option value="swift">Swift</option>
              <option value="csharp">C#</option>
              <option value="shell">Shell</option>
              <option value="sql">SQL</option>
              <option value="plaintext">Plain Text</option>
            </select>
            <button
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6 py-2 rounded-lg shadow transition"
              onClick={handleSendMessage}
              disabled={uploading || !codeContent.trim()}
              type="button"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <div className="flex mt-2 px-4 pb-4 items-center gap-2 rounded-2xl shadow-lg bg-[#181a20] border border-[#22304a] transition-all duration-300">
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
          <button
            className={`px-3 py-2 rounded-lg shadow border ${codeMode ? "bg-blue-700 text-white" : "bg-[#22304a] text-[#60a5fa]"} hover:bg-blue-800 transition`}
            onClick={() => setCodeMode((prev) => !prev)}
            type="button"
            disabled={uploading}
          >
            {codeMode ? "Text" : "Code"}
          </button>
          <input
            className="flex-1 rounded-l-lg px-3 py-2 bg-[#171b24] text-[#e0e7ef] placeholder:text-[#64748b] border border-[#22304a] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (socketRef.current && selectedUser && session?.user?.id) {
                socketRef.current.emit("typing", {
                  roomId: getRoomId(session.user.id, selectedUser._id),
                  userId: session.user.id,
                });
              }
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your message..."
            disabled={uploading}
          />
          <button
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6 py-2 rounded-r-lg shadow transition"
            onClick={handleSendMessage}
            disabled={uploading}
            type="button"
          >
            Send
          </button>
        </div>
      )}
      {/* Modal for media preview */}
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
