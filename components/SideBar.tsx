"use client";
import { useRef, useState, useEffect } from "react";
import {
  MessageSquare,
  User,
  Settings,
  MessageSquareCode,
  BellRing,
} from "lucide-react";
import { Bebas_Neue } from "next/font/google";
import NotificationModal from "./NotificationModal";
import { useSession } from "next-auth/react";

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
});

export default function SideBar() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const sidebarRef = useRef<HTMLDivElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    { id: string; message: string; time?: string; read?: boolean }[]
  >([]);
  const [hasUnread, setHasUnread] = useState(false);

   const handleAcceptInvite = async (notif: any) => {
    // Call your backend to accept the invite
    await fetch("/api/connections/acceptInvite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        fromUserId: notif.meta?.fromUserId,
        notificationId: notif.id,
      }),
    });
    // Remove the notification from state
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
  };

   const handleRejectInvite = async (notif: any) => {
    // Call your backend to reject the invite
    await fetch("/api/connections/rejectInvite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notificationId: notif.id,
        fromUserId: notif.meta?.fromUserId,
      }),
    });
    // Remove the notification from state
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
  };


  // Fetch notifications from API
  useEffect(() => {
    async function fetchNotifications() {
      const res = await fetch(`/api/notifications/${userId}`);
      const data = await res.json();
      setNotifications(
        data.map((n: any) => ({
          id: n._id,
          message: n.message,
          time: new Date(n.time).toLocaleString(),
          read: n.read,
          meta: n.meta,
        }))
      );
      setHasUnread(data.some((n: any) => !n.read));
    }
    fetchNotifications();
  }, [userId, notifOpen]);

  // Remove notification
  const handleRemove = async (id: string) => {
    await fetch(`/api/notifications/delete/${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    await fetch(`/api/notifications/markRead/${userId}`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setHasUnread(false);
  };

  const topOptions = [
    { icon: <MessageSquare size={24} />, label: "Chats", onClick: undefined },
    {
      icon: (
        <span className="relative">
          <BellRing size={24} />
          {hasUnread && (
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#23272f]" />
          )}
        </span>
      ),
      label: "Notifications",
      onClick: () => setNotifOpen(true),
    },
  ];

  const bottomOptions = [
    { icon: <User size={24} />, label: "Profile" },
    { icon: <Settings size={24} />, label: "Settings" },
  ];

  return (
    <>
      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 transition-opacity pointer-events-none" />
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
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {/* Logo and Website Name */}
        <div className="flex items-center px-4 mb-6">
          <MessageSquareCode size={36} className="text-blue-400" />
          <span
            className={`ml-2 text-3xl font-bold text-white transition-all duration-300
              ${open ? "opacity-100 w-auto" : "opacity-0 w-0"}
            ${bebas.className}`}
            style={{
              display: "inline-block",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            CodeYap
          </span>
        </div>

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
              onClick={opt.onClick}
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

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onRemove={handleRemove}
        onMarkAllRead={handleMarkAllRead}
        onAcceptInvite={handleAcceptInvite}
        onRejectInvite={handleRejectInvite}
      />
    </>
  );
}
