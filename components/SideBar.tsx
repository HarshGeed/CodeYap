"use client";
import { useRef, useState, useEffect } from "react";
import { Home, MessageSquare, User, Settings, Menu, MessageSquareCode } from "lucide-react";
import { Bebas_Neue } from "next/font/google";

const topOptions = [
  { icon: <Home size={24} />, label: "Home" },
  { icon: <MessageSquare size={24} />, label: "Chats" },
];

const bottomOptions = [
  { icon: <User size={24} />, label: "Profile" },
  { icon: <Settings size={24} />, label: "Settings" },
];

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
});


export default function SideBar() {
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <>
      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full flex flex-col bg-[#1f1f1f] shadow-lg z-50 py-4 transition-all duration-300
          ${open ? "w-48" : "w-16"}`}
        style={{
          pointerEvents: "auto",
          opacity: open ? 1 : 0.85,
        }}
      >
        {/* Logo and Website Name */}
        <div className="flex items-center px-4 mb-6">
          <MessageSquareCode size={36} className="text-blue-400 mt-1" />
          <span
            className={`ml-2 text-3xl font-bold text-white transition-all duration-300
              ${open ? "opacity-100 w-auto" : "opacity-0 w-0"}
            ${bebas.className}`}
            style={{ display: "inline-block", whiteSpace: "nowrap", overflow: "hidden" }}
          >
            CodeYap
          </span>
        </div>

        {/* Open/Close Button - always at the left */}
        <button
          className="mb-4 ml-2 rounded-full shadow p-2 transition text-white"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Close sidebar" : "Open sidebar"}
        >
          <Menu size={24} />
        </button>

        {/* Top Option Icons and Labels */}
        <div className="flex flex-col gap-2 w-full mt-2">
          {topOptions.map((opt, idx) => (
            <button
              key={idx}
              className={`flex items-center gap-3 px-4 py-2 text-gray-200 hover:text-blue-400 focus:outline-none transition-all duration-300
                ${open ? "" : "justify-center cursor-default"}
              `}
              title={opt.label}
              tabIndex={open ? 0 : -1}
              aria-label={opt.label}
              disabled={!open}
            >
              {opt.icon}
              <span
                className={`overflow-hidden transition-all duration-300
                  ${open ? "opacity-100 w-auto ml-2" : "opacity-0 w-0 ml-0"}
                `}
                style={{ display: "inline-block" }}
              >
                {opt.label}
              </span>
            </button>
          ))}
        </div>

        {/* Spacer to push bottom options to the bottom */}
        <div className="flex-1" />

        {/* Divider above bottom buttons */}
        <div
          className={`w-4/5 mx-auto my-2 border-t border-gray-700 transition-all duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Bottom Option Icons and Labels */}
        <div className="flex flex-col gap-2 w-full mb-4">
          {bottomOptions.map((opt, idx) => (
            <button
              key={opt.label}
              className={`flex items-center gap-3 px-4 py-2 text-gray-200 hover:text-blue-400 focus:outline-none transition-all duration-300
                ${open ? "" : "justify-center cursor-default"}
              `}
              title={opt.label}
              tabIndex={open ? 0 : -1}
              aria-label={opt.label}
              disabled={!open}
            >
              {opt.icon}
              <span
                className={`overflow-hidden transition-all duration-300
                  ${open ? "opacity-100 w-auto ml-2" : "opacity-0 w-0 ml-0"}
                `}
                style={{ display: "inline-block" }}
              >
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}