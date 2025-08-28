import React, { useState, useCallback } from "react";
import { Paperclip } from "lucide-react";
import { CodeEditor } from "./CodeEditor";

interface ChatInputBarProps {
  codeMode: boolean;
  setCodeMode: (v: boolean) => void;
  codeContent: string;
  setCodeContent: (v: string) => void;
  codeLanguage: string;
  setCodeLanguage: (v: string) => void;
  newMessage: string;
  setNewMessage: (v: string) => void;
  uploading: boolean;
  uploadPercent: number | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSendMessage: (messageText?: string) => void;
}

const ChatInputBar: React.FC<ChatInputBarProps> = React.memo(({
  codeMode,
  setCodeMode,
  codeContent,
  setCodeContent,
  codeLanguage,
  setCodeLanguage,
  newMessage,
  setNewMessage,
  uploading,
  uploadPercent,
  handleFileChange,
  handleSendMessage,
}) => {
  // Local state for message input
  const [internalValue, setInternalValue] = useState(newMessage);

  // Sync with parent if newMessage prop changes (e.g. after send)
  React.useEffect(() => {
    setInternalValue(newMessage);
  }, [newMessage]);

  // Only update parent on blur or submit
  const handleBlur = useCallback(() => {
    setNewMessage(internalValue);
  }, [internalValue, setNewMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Update the parent state and send message with current value
      setNewMessage(internalValue);
      handleSendMessage(internalValue);
    }
  }, [internalValue, setNewMessage, handleSendMessage]);

  const handleSendClick = useCallback(() => {
    setNewMessage(internalValue);
    handleSendMessage(internalValue);
  }, [internalValue, setNewMessage, handleSendMessage]);

  return codeMode ? (
    <div className="w-full flex flex-col items-start mt-2 px-4 pb-4 rounded-2xl shadow-lg bg-[#181a20] border border-[#22304a] transition-all duration-300">
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
          onClick={handleSendClick}
          disabled={uploading || !codeContent.trim()}
          type="button"
        >
          Send
        </button>
      </div>
    </div>
  ) : (
    <div className="flex mt-2 pb-2 items-center gap-2 rounded-2xl shadow-lg transition-all duration-300">
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
        value={internalValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={uploading}
      />
      <button
        className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6 py-2 rounded-r-lg shadow transition"
        onClick={handleSendClick}
        disabled={uploading}
        type="button"
      >
        Send
      </button>
    </div>
  );
});

ChatInputBar.displayName = "ChatInputBar";

export default ChatInputBar; 