"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { Bell } from "lucide-react";
import { useOnline } from "../context/OnlineContext";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { getGatewayUrl, getWsGatewayUrl } from "@/lib/gateway";


export default function NotificationPopover() {
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const socket = React.useRef<WebSocket>(null);
  const [redDot, setRedDot] = React.useState(false);
  const { setOnline } = useOnline()!;
  const { toast } = useToast();
  const navigate = useRouter();

  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(getGatewayUrl("/api/v1/notification/notifications"), {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        const data: any[] = await res.json();
        // reverse the data
        data.reverse();
        setNotifications(data || []);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  React.useEffect(() => {
    socket.current = new WebSocket(getWsGatewayUrl("/ws/notification/live"));
    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "friends:online" && data.payload) {
        setOnline(data.payload.onlineFriends || []);
      } else if (data.type === "presence" && data.payload) {
        if (data.payload.status === "online") {
          setOnline((prev) => [...prev, data.payload.userId]);
        } else if (data.payload.status === "offline") {
          setOnline((prev) => prev.filter((id) => id !== data.payload.userId));
        }
      } else if (
        data.type === "message:new"
        || data.type === "friend:accepted"
        || data.type === "friend:request"
      ) {
        setNotifications((prev) => [{
          title: data.title,
          content: data.content,
        }, ...prev]);
        setRedDot(true);
        
        // Trigger toast notification
        toast({
          title: data.title,
          description: data.content,
          action: (
            <ToastAction
              altText="View"
              className="bg-black text-white hover:bg-gray-800"
              onClick={() => {
                navigate.push(
                  `/users/${data.content.split(" ")[0].replace("@", "")}`
                );
              }}
            >
              View
            </ToastAction>
          ),
        });
      } else if (data.type === "tournament:match-started") {
        setNotifications((prev) => [{
          title: data.title,
          content: data.content,
        }, ...prev]);
        setRedDot(true);
        
        // Trigger toast notification for tournament match
        toast({
          title: data.title,
          description: data.content,
          action: (
            <ToastAction
              altText="Join Match"
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={() => {
                navigate.push(
                  `/game2d?tournamentId=${data.tournamentId}&roomId=${data.gameMatchId}&privatee=true`
                );
              }}
            >
              Join Match
            </ToastAction>
          ),
        });
      }
    };
    return () => {
      socket.current?.close();
    };
  }, [])

  return (
    <Popover.Root onOpenChange={() => { setRedDot(false); }}>
      <Popover.Trigger asChild>
        <button className="relative p-2 rounded-full transition">
          {redDot && <div className="absolute top-2 right-3 w-2 h-2 bg-red-500 rounded-full"></div>}
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
