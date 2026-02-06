"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { Bell } from "lucide-react";

export default function NotificationPopover() {
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/notification/notifications`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await res.json();
        setNotifications(data || []);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="relative p-2 rounded-full transition">
          <Bell className="text-white h-[20px] sm:h-[25px] lg:h-[30px] w-auto" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          className="z-50 w-52 sm:w-60 lg:w-80 rounded-xl bg-white shadow-lg border border-gray-200 p-4"
        >
          <div className="text-gray-800 font-semibold mb-2">Notifications</div>

          <div className="max-h-60 overflow-y-auto pr-1">
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="text-sm text-gray-500">No notifications</div>
            ) : (
              <ul className="space-y-2">
                {notifications.map((notif, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    <h2 className="font-bold">{notif.title}</h2>
                    <p>{notif.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
