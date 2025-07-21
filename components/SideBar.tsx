"use client";
import { useRef, useState, useEffect } from "react";
import {
  MessageSquare,
  User,
  Settings,
  MessageSquareCode,
  BellRing,
  Users,
  LogOut,
} from "lucide-react";
import { Bebas_Neue } from "next/font/google";
import NotificationModal from "./NotificationModal";
import ShowGroupDialog from "./ShowGroupDialog";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
});

interface ConnectedUser {
  _id: string;
  username: string;
  profileImage?: string;
}

export default function SideBar() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const sidebarRef = useRef<HTMLDivElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);

  // Fetch connected users for group dialog
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/connections/${userId}`)
      .then((res) => res.json())
      .then((data) => setConnectedUsers(data))
      .catch(() => setConnectedUsers([]));
  }, [userId, showGroupDialog]);

  const [notifications, setNotifications] = useState<
    { id: string; message: string; time?: string; read?: boolean; meta?: any }[]
  >([]);
  const [hasUnread, setHasUnread] = useState(false);

  const handleAcceptInvite = async (notif: any) => {
    if (notif.meta?.type === "group-invite") {
      // Accept group invite
      await fetch("/api/connections/acceptInvite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          notificationId: notif.id,
          groupId: notif.meta?.groupId,
        }),
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id
            ? {
                ...n,
                message: `You joined the group "${notif.meta?.groupName}".`,
                meta: { ...n.meta, accepted: true },
              }
            : n
        )
      );
    } else {
      // Accept connection invite
      await fetch("/api/connections/acceptInvite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          fromUserId: notif.meta?.fromUserId,
          notificationId: notif.id,
        }),
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id
            ? {
                ...n,
                message: `You accepted ${notif.meta?.fromUsername}'s request.`,
                meta: { ...n.meta, accepted: true },
              }
            : n
        )
      );
    }
  };

  const handleRejectInvite = async (notif: any) => {
    if (notif.meta?.type === "group-invite") {
      // Reject group invite
      await fetch("/api/connections/rejectInvite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId: notif.id,
          groupId: notif.meta?.groupId,
          userId,
        }),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    } else {
      // Reject connection invite
      await fetch("/api/connections/rejectInvite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId: notif.id,
          fromUserId: notif.meta?.fromUserId,
        }),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    }
  };

  // Fetch notifications from API
  useEffect(() => {
    async function fetchNotifications() {
      if (!userId) return;
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

  // Group creation handler
  const handleCreateGroup = async (groupName: string, memberIds: string[]) => {
    setGroupLoading(true);
    try {
      await fetch("/api/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName,
          members: memberIds,
          creatorId: session?.user?.id,
        }),
      });
    } catch (e) {
      // Optionally show error
    }
    setGroupLoading(false);
  };

  const topOptions = [
    {
      icon: (
        <span className="flex items-center justify-center w-6 h-6">
          <MessageSquare size={24} />
        </span>
      ),
      label: "Chats",
      onClick: () => {},
    },
    {
      icon: (
        <span className="relative flex items-center justify-center w-6 h-6">
          <BellRing size={24} />
          {hasUnread && (
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#23272f]" />
          )}
        </span>
      ),
      label: "Notifications",
      onClick: () => setNotifOpen(true),
    },
    {
      icon: (
        <span className="flex items-center justify-center w-6 h-6">
          <Users size={24} />
        </span>
      ),
      label: "New Group +",
      onClick: () => setShowGroupDialog(true),
    },
  ];

  const bottomOptions = [
    {
      icon: <User size={24} />,
      label: "Profile",
      onClick: () => {
        router.push(`/profile/${userId}`);
      },
    },
    {
      icon: <Settings size={24} />,
      label: "Settings",
      onClick: () => {
        // handle navigation to settings
      },
    },
    {
      icon: <LogOut size={24} />,
      label: "Log out",
      onClick: () => {
        signOut();
      },
    },
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
        className={`fixed top-0 left-0 h-full flex flex-col bg-gradient-to-b from-[#181e29]/90 to-[#121212]/90 shadow-2xl z-50 py-6 px-2 transition-all duration-300
        ${open ? "w-56" : "w-16"}
        backdrop-blur-md border-r border-[#22304a]/40
      `}
        style={{
          pointerEvents: "auto",
          opacity: open ? 1 : 0.92,
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {/* Logo and Website Name */}
        <div className="flex items-center px-2 mb-8">
          <MessageSquareCode size={36} className="text-[#60a5fa] drop-shadow" />
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
              className={`group flex items-center px-0 py-2 rounded-xl text-[#e0e7ef]
  hover:text-[#60a5fa] hover:bg-[#22304a]/60
  transition-all duration-300 shadow-sm w-full`}
              title={opt.label}
              tabIndex={open ? 0 : -1}
              aria-label={opt.label}
              disabled={!open}
              onClick={opt.onClick}
            >
              <span className="flex items-center justify-center w-12">
                {opt.icon}
              </span>
              <span
                className={`ml-2 whitespace-nowrap overflow-hidden transition-all duration-300
    ${open ? "opacity-100" : "opacity-0 w-0"}`}
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
          className={`w-4/5 mx-auto my-2 border-t border-[#22304a]/60 transition-all duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Bottom Option Icons and Labels */}
        <div className="flex flex-col gap-2 w-full mb-4">
          {bottomOptions.map((opt, idx) => (
            <button
              key={opt.label}
              className={`flex items-center px-0 py-2 rounded-xl
    text-[#e0e7ef] hover:text-[#60a5fa] hover:bg-[#22304a]/60
    focus:outline-none transition-all duration-300
    ${open ? "gap-3 px-4 w-full justify-start" : "justify-center w-12 h-12"}
    shadow-sm
    `}
              title={opt.label}
              tabIndex={open ? 0 : -1}
              aria-label={opt.label}
              disabled={!open && opt.label === "Notifications" ? false : !open}
              onClick={opt.onClick}
            >
              <span className="flex items-center justify-center w-6 h-6">
                {opt.icon}
              </span>
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

      {/* ShowGroupDialog */}
      <ShowGroupDialog
        open={showGroupDialog}
        onClose={() => setShowGroupDialog(false)}
        connectedUsers={connectedUsers}
        onCreate={handleCreateGroup}
        loading={groupLoading}
      />

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
