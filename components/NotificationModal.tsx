import React from "react";

interface Notification {
  id: string;
  message: string;
  time?: string;
  read?: boolean;
  meta?: {
    type?: string;
    [key: string]: any;
  };
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onRemove: (id: string) => void;
  onMarkAllRead: () => void;
  onAcceptInvite: (n: Notification) => void;
  onRejectInvite: (n: Notification) => void;
}

export default function NotificationModal({
  isOpen,
  onClose,
  notifications,
  onRemove,
  onMarkAllRead,
  onAcceptInvite,
  onRejectInvite,
}: NotificationModalProps) {
  if (!isOpen) return null;
console.log(notifications);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-[#23272f] rounded-xl p-6 w-full max-w-md relative max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-4 text-xl text-white"
          onClick={onClose}
        >
          ×
        </button>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Notifications</h2>
          {notifications.some((n) => !n.read) && (
            <button
              className="text-xs text-blue-400 underline"
              onClick={onMarkAllRead}
            >
              Mark all as read
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="text-gray-400">No notifications.</div>
        ) : (
          <ul className="space-y-3">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`bg-[#181a20] rounded p-3 text-white flex items-center justify-between ${
                  !n.read ? "border-l-4 border-blue-500" : ""
                }`}
              >
                <div>
                  <div>{n.message}</div>
                  {(n.meta?.type === "invite" || n.meta?.type === "group-invite") && !n.meta?.accepted &&(
                    <div className="flex gap-2 mt-2">
                      <button
                        className="px-2 py-1 bg-green-600 text-white rounded"
                        onClick={() => onAcceptInvite(n)}
                      >
                        Accept
                      </button>
                      <button
                        className="px-2 py-1 bg-red-600 text-white rounded"
                        onClick={() => onRejectInvite(n)}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {n.time && (
                    <div className="text-xs text-gray-400 mt-1">{n.time}</div>
                  )}
                </div>
                <button
                  className="ml-4 text-gray-400 hover:text-red-500 text-lg"
                  onClick={() => onRemove(n.id)}
                  title="Remove notification"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
