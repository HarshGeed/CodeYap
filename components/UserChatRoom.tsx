"use client";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { connectSocket, registerUser } from "@/lib/socket";
import Link from "next/link";
import MessageList from "./MessageList";
import ChatInputBar from "./ChatInputBar";
import { Github } from "lucide-react";
import GithubShareModal from "./GithubShareModal";

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
  const [githubModalOpen, setGithubModalOpen] = useState(false);

  // Check for GitHub OAuth success on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const githubSuccess = urlParams.get('github') === 'success';
    
    console.log("UserChatRoom OAuth check:", {
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
              // Replace temp message with real message
              const newMessages = [...prev];
              newMessages[tempMessageIndex] = msg;
              return newMessages;
            }
          }
          
          // For receiver's message or if no temp message found, add normally
          // But check for duplicates first
          const messageExists = prev.some(m => m._id === msg._id);
          if (messageExists) {
            return prev;
          }
          
          return [...prev, msg];
        });
        
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
  }, [messages, selectedUser, session?.user?.id, seenMessageIds]);

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
        message: "", // Required field
        senderId: session?.user?.id || "",
        receiverId: selectedUser._id,
        timestamp: new Date().toISOString(),
        contentType: "code",
        code: {
          language: codeLanguage,
          content: codeContent,
        },
      };
      
      // Optimistically add to UI immediately for sender
      const tempMsg: Message = { ...msgObj, _id: `temp-${Date.now()}` };
      setMessages((prev) => [...prev, tempMsg]);
      setCodeContent("");
      setCodeMode(false);
      onUpdateLastMessage(selectedUser._id, "[code]");
      
      try {
        // Save to backend and get the message with _id
        const res = await fetch("/api/messages/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(msgObj),
        });
        const savedMsg = await res.json();
        console.log("[DEBUG] Code message sent and saved:", savedMsg);
        
        // Replace temp message with real message
        setMessages((prev) => prev.map(msg => 
          msg._id === tempMsg._id ? savedMsg : msg
        ));
        
        // Emit via socket for other users
        socketRef.current?.emit("send-message", savedMsg);
      } catch (error) {
        console.error("Failed to send code message:", error);
        // Remove temp message on error
        setMessages((prev) => prev.filter(msg => msg._id !== tempMsg._id));
      }
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

    // Optimistically add to UI immediately for sender
    const tempMsg: Message = { ...msgObj, _id: `temp-${Date.now()}` };
    setMessages((prev) => [...prev, tempMsg]);
    const messageToUpdate = newMessage;
    setNewMessage("");
    onUpdateLastMessage(selectedUser._id, messageToUpdate);

    try {
      // Save to backend and get the message with _id
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msgObj),
      });
      const savedMsg = await res.json();
      console.log("[DEBUG] Message sent and saved:", savedMsg);

      // Replace temp message with real message
      setMessages((prev) => prev.map(msg => 
        msg._id === tempMsg._id ? savedMsg : msg
      ));

      // Emit via socket for other users
      socketRef.current?.emit("send-message", savedMsg);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove temp message on error and restore input
      setMessages((prev) => prev.filter(msg => msg._id !== tempMsg._id));
      setNewMessage(messageToUpdate);
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
        sessionStorage.setItem("github_oauth_user_id", selectedUser._id);
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
              // Save to backend first and get the message with _id
              const res = await fetch("/api/messages/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(msgObj),
              });
              const savedMsg = await res.json();
              // Then emit via socket (do NOT add to state here - the socket handler will do that)
              socketRef.current?.emit("send-message", savedMsg);
              onUpdateLastMessage(selectedUser._id, fileObj.url);
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

  // Memoized utility functions
  const memoizedFormatTime = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  const memoizedFormatDate = useCallback((dateStr: string) => {
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
  }, []);

  const memoizedFileTypeFromUrl = useCallback((url: string | undefined | null) => {
    if (!url || typeof url !== "string") return "file";
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return "image";
    if (url.match(/\.(mp4|webm|ogg|mov)$/i)) return "video";
    if (url.match(/\.(pdf|docx?|pptx?|xlsx?|txt)$/i)) return "document";
    return "file";
  }, []);

  const memoizedSeenMessageIds = useMemo(() => seenMessageIds, [seenMessageIds]);
  const memoizedMessages = useMemo(() => messages, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with profile image, username, and status */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 border-b border-[#22304a]/30 relative">
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
      {/* Chat messages */}
      <MessageList
        messages={memoizedMessages}
        sessionUserId={session?.user?.id ?? ""}
        seenMessageIds={memoizedSeenMessageIds}
        formatTime={memoizedFormatTime}
        formatDate={memoizedFormatDate}
        fileTypeFromUrl={memoizedFileTypeFromUrl}
        onCopyCode={() => {}}
        setModalMedia={setModalMedia}
        setModalLoading={setModalLoading}
        bottomRef={bottomRef}
      />
      <ChatInputBar
        codeMode={codeMode}
        setCodeMode={setCodeMode}
        codeContent={codeContent}
        setCodeContent={setCodeContent}
        codeLanguage={codeLanguage}
        setCodeLanguage={setCodeLanguage}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        uploading={uploading}
        uploadPercent={uploadPercent}
        handleFileChange={handleFileChange}
        handleSendMessage={handleSendMessage}
      />
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
