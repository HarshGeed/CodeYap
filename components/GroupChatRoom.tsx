"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import default_pfp from "@/public/default_pfp.jpg";
import { useSession } from "next-auth/react";
import { Paperclip } from "lucide-react";
import { CodeEditor, CodeHighlighter } from "./CodeEditor";
import { Github } from "lucide-react";
import GithubShareModal from "./GithubShareModal";

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
  contentType?: string;
  code?: {
    language: string;
    content: string;
  };
}

export default function GroupChatRoom({ group }: GroupChatRoomProps) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<{
    emit: (event: string, data: unknown) => void;
    on: (event: string, handler: (data: unknown) => void) => void;
    off: (event: string, handler: (data: unknown) => void) => void;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const [uploading, setUploading] = useState(false);
  const [modalMedia, setModalMedia] = useState<{
    type: string;
    src: string;
  } | null>(null);
  const [modalLoading, setModalLoading] = useState(true);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [codeMode, setCodeMode] = useState(false);
  const [codeContent, setCodeContent] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [githubModalOpen, setGithubModalOpen] = useState(false);

  // Debug modal state changes
  useEffect(() => {
    console.log("GitHub modal state changed:", githubModalOpen);
  }, [githubModalOpen]);

  // Check for GitHub OAuth success on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const githubSuccess = urlParams.get('github') === 'success';
    
    console.log("GroupChatRoom OAuth check:", {
      githubSuccess,
      url: window.location.href,
    });
    
    if (githubSuccess) {
      console.log("OAuth success detected, checking for valid GitHub token");
      
      // Clean up the URL first
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('github');
      window.history.replaceState({}, '', newUrl.toString());
      
      // Check if we have a valid GitHub token by making an API request
      fetch("/api/github/repos")
        .then(response => {
          if (response.ok) {
            console.log("Valid GitHub token found, opening modal");
            setGithubModalOpen(true);
          } else {
            console.log("No valid GitHub token found after OAuth");
          }
        })
        .catch(error => {
          console.error("Error checking GitHub token after OAuth:", error);
        });
    }
  }, []);

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
          for (const fileObj of data.urls) {
            const msgObj: GroupMessage = {
              groupId: group._id,
              senderId: session?.user?.id || "",
              senderName: session?.user?.username,
              senderImage: session?.user?.profileImage,
              message: fileObj.url,
              timestamp: new Date().toISOString(),
              fileType: fileTypeFromUrl(fileObj.url),
            };
            // Save to backend first and get the message with _id
            const res = await fetch("/api/group-messages/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(msgObj),
            });
            const savedMsg = await res.json();
            // Then emit via socket (do NOT add to state here - the socket handler will do that)
            socketRef.current?.emit("send-group-message", savedMsg);
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
          // Check if this is the sender's own message that we already added optimistically
          const isSenderMessage = msg.senderId === session?.user?.id;
          
          setMessages((prev) => {
            // If this is sender's message, check if we already have a temp version
            if (isSenderMessage) {
              const tempMessageIndex = prev.findIndex(m => 
                m._id?.startsWith('temp-') && 
                m.senderId === msg.senderId && 
                Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 5000 // Within 5 seconds
              );
              
              if (tempMessageIndex !== -1) {
                // Replace temp message with real message (but for groups, we don't get real IDs back)
                // So just remove the temp message to avoid duplicates
                return prev.filter(m => m._id !== prev[tempMessageIndex]._id);
              }
            }
            
            // For receiver's message or if no temp message found, add normally
            return [...prev, msg];
          });
        }
      };

      socket.on("receive-group-message", handler);

      return () => {
        socket.emit("leave-group", group._id);
        socket.off("receive-group-message", handler);
      };
    });
  }, [group?._id, session?.user?.id]);

  // Listen for group-typing events
  useEffect(() => {
    if (!group?._id || !session?.user?.id) return;
    let cleanup: (() => void) | undefined;
    import("@/lib/socket").then(({ connectSocket }) => {
      if (!socketRef.current) {
        socketRef.current = connectSocket();
      }
      const socket = socketRef.current;
      const handleGroupTyping = (data: { groupId: string; userId: string; username: string }) => {
        if (data.groupId === group._id && data.userId !== session.user.id) {
          setTypingUsers((prev) => {
            if (!prev.includes(data.username)) {
              return [...prev, data.username];
            }
            return prev;
          });
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u !== data.username));
          }, 2000);
        }
      };
      socket.on("group-typing", handleGroupTyping);
      cleanup = () => socket.off("group-typing", handleGroupTyping);
    });
    return () => { if (cleanup) cleanup(); };
  }, [group?._id, session?.user?.id]);

  const handleSendMessage = async () => {
    if (codeMode) {
      if (!codeContent.trim()) return;
      const msgObj: GroupMessage = {
        groupId: group._id,
        senderId: session?.user?.id || "",
        senderName: session?.user?.username,
        senderImage: session?.user?.profileImage,
        message: "", // Not used for code
        timestamp: new Date().toISOString(),
        contentType: "code",
        code: {
          language: codeLanguage,
          content: codeContent,
        },
      };
      
      // Optimistically add to UI immediately for sender
      const tempMsg: GroupMessage = { ...msgObj, _id: `temp-${Date.now()}` };
      setMessages((prev) => [...prev, tempMsg]);
      setCodeContent("");
      setCodeMode(false);
      
      try {
        // Save to backend first
        await fetch("/api/group-messages/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(msgObj),
        });
        
        // Emit via socket for other users
        socketRef.current?.emit("send-group-message", msgObj);
      } catch (error) {
        console.error("Failed to send code message:", error);
        // Remove temp message on error
        setMessages((prev) => prev.filter(msg => msg._id !== tempMsg._id));
      }
      return;
    }
    
    if (!newMessage.trim()) return;
    const msgObj: GroupMessage = {
      groupId: group._id,
      senderId: session?.user?.id || "",
      senderName: session?.user?.username,
      senderImage: session?.user?.profileImage,
      message: newMessage,
      timestamp: new Date().toISOString(),
    };
    
    // Optimistically add to UI immediately for sender
    const tempMsg: GroupMessage = { ...msgObj, _id: `temp-${Date.now()}` };
    setMessages((prev) => [...prev, tempMsg]);
    const messageToSend = newMessage;
    setNewMessage("");
    
    try {
      // Save to backend first
      await fetch("/api/group-messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msgObj),
      });
      
      // Emit via socket for other users
      socketRef.current?.emit("send-group-message", msgObj);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove temp message on error and restore input
      setMessages((prev) => prev.filter(msg => msg._id !== tempMsg._id));
      setNewMessage(messageToSend);
    }
  };

  // GitHub Share handler
  const handleGithubShare = async () => {
    console.log("GitHub Share button clicked");
    try {
      // Check if user has a valid GitHub token by making a request to repos endpoint
      console.log("Making request to /api/github/repos to check authentication");
      const response = await fetch("/api/github/repos");
      
      console.log("GitHub repos response status:", response.status);
      
      if (response.ok) {
        // User has a valid token, open the modal
        console.log("User has valid GitHub token, opening modal");
        setGithubModalOpen(true);
      } else if (response.status === 401) {
        // User is not authenticated, redirect to GitHub OAuth
        console.log("User not authenticated, redirecting to OAuth");
        sessionStorage.setItem("github_oauth_group_id", group._id);
        const res = await fetch("/api/github/start-oauth");
        const data = await res.json();
        window.location.href = data.url;
      } else {
        // Other error occurred
        console.error("Error checking GitHub authentication:", response.status);
        alert("Error checking GitHub authentication. Please try again.");
      }
    } catch (error) {
      console.error("Error in handleGithubShare:", error);
      alert("Error connecting to GitHub. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Group Header */}
      <div className="flex items-center gap-4 px-4 pt-4 pb-2 border-b border-[#22304a]/30 relative">
        <div className="h-12 w-12 bg-[#22304a] rounded-full flex items-center justify-center text-[#60a5fa] font-bold text-2xl">
          {group.name[0]}
        </div>
        <div>
          <div className="font-bold text-xl text-[#c0cad6]">{group.name}</div>
          <div className="text-xs text-[#60a5fa]/80">
            {group.members.length} members
            {typingUsers.length > 0 && (
              <span className="ml-2 text-[#60a5fa]">
                {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
              </span>
            )}
          </div>
        </div>
        {/* GitHub Share Button */}
        <button
          className="absolute right-4 top-4 flex items-center gap-2 bg-[#181a20] border border-[#22304a] text-[#e0e7ef] hover:bg-[#222c3a] px-3 py-2 rounded-lg shadow transition z-10"
          onClick={handleGithubShare}
          type="button"
          title="Share code from GitHub"
        >
          <Github size={20} />
          <span className="hidden sm:inline">Share from GitHub</span>
        </button>
        <GithubShareModal
          open={githubModalOpen}
          onClose={() => setGithubModalOpen(false)}
          onShare={({ code, language }) => {
            setCodeContent(code);
            setCodeLanguage(language);
            setCodeMode(true);
            setGithubModalOpen(false);
          }}
        />
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
              const isOwn = msg.senderId === session?.user?.id;
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
                          {msg.contentType === "code" && msg.code ? (
                            <div className="max-w-[32rem]">
                              <CodeHighlighter code={msg.code.content} language={msg.code.language} />
                            </div>
                          ) : (
                            type === "image" ? (
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
                            )
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
      <div className="flex flex-col w-full mt-2 px-4 pb-4">
        {codeMode ? (
          <div className="w-full flex flex-col items-start rounded-2xl shadow-lg bg-[#181a20] border border-[#22304a] transition-all duration-300 mb-2">
            <div className="w-full">
              <CodeEditor
                height="260px"
                language={codeLanguage}
                code={codeContent}
                onChange={setCodeContent}
                readOnly={false}
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
                onClick={() => setCodeMode(false)}
                type="button"
                disabled={uploading}
              >
                Text
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
          <div className="flex items-center gap-2 rounded-2xl shadow-lg transition-all duration-300">
            <label className="cursor-pointer bg-[#22304a] text-[#60a5fa] px-3 py-2 rounded-lg shadow border border-[#22304a] hover:bg-[#2563eb]/20 transition">
              <input
                type="file"
                multiple
                hidden
                onChange={handleFileChange}
                accept="image/*"
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
              onClick={() => setCodeMode(true)}
              type="button"
              disabled={uploading}
            >
              Code
            </button>
            <input
              className="flex-1 rounded-l-lg px-3 py-2 bg-[#171b24] text-[#e0e7ef] placeholder:text-[#64748b] border border-[#22304a] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (socketRef.current && group && session?.user?.id && session?.user?.username) {
                  socketRef.current.emit("group-typing", {
                    groupId: group._id,
                    userId: session.user.id,
                    username: session.user.username,
                  });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
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
