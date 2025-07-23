import React from "react";
import Image from "next/image";
import { Download, Copy } from "lucide-react";
import { CodeHighlighter } from "./CodeEditor";

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

interface MessageListProps {
  messages: Message[];
  sessionUserId: string;
  seenMessageIds: Set<string>;
  formatTime: (dateStr: string) => string;
  formatDate: (dateStr: string) => string;
  fileTypeFromUrl: (url: string | undefined | null) => string;
  onCopyCode?: (code: string, idx: number) => void;
  copiedIdx?: number | null;
  setModalMedia: (media: { type: string; src: string } | null) => void;
  setModalLoading: (loading: boolean) => void;
  bottomRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = React.memo(({
  messages,
  sessionUserId,
  seenMessageIds,
  formatTime,
  formatDate,
  fileTypeFromUrl,
  onCopyCode,
  copiedIdx,
  setModalMedia,
  setModalLoading,
  bottomRef,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 rounded">
      {messages.map((msg, idx) => {
        const msgDate = new Date(msg.timestamp).toDateString();
        const showDate =
          idx === 0 || msgDate !== new Date(messages[idx - 1].timestamp).toDateString();
        const isOwn = (msg.sender || msg.senderId) === sessionUserId;
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
                  {onCopyCode && (
                    <button
                      className="absolute top-2 right-2 p-1 bg-[#171b24] rounded hover:bg-[#2563eb] transition text-[#60a5fa] text-xs flex items-center"
                      style={{ zIndex: 2 }}
                      onClick={() => onCopyCode(msg.code!.content, idx)}
                      title="Copy code"
                    >
                      <Copy size={14} />
                      {copiedIdx === idx && (
                        <span className="ml-1 text-green-400 text-xs">Copied!</span>
                      )}
                    </button>
                  )}
                  <CodeHighlighter code={msg.code!.content} language={msg.code!.language} />
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
            <div className={`mb-2 flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <span className={`max-w-[70%] break-words px-3 py-2 rounded-lg shadow ${isOwn ? "bg-[#3f495f] text-white rounded-br-sm" : "bg-[#22304a] text-[#e0e7ef] rounded-bl-sm"}`}>
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
                        {msg.originalName || (() => {
                          try {
                            const urlObj = new URL(msg.message);
                            return decodeURIComponent(urlObj.pathname.split("/").pop() || "Document");
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
  );
});

MessageList.displayName = "MessageList";

export default MessageList; 