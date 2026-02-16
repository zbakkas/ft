"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { User } from "lucide-react";
import { useOnline } from "@/app/context/OnlineContext";
import { getGatewayUrl } from "@/lib/gateway";

interface AvatarWithOnlineStatusProps {
  username: string;
  userId: string;
}

export default function AvatarWithOnlineStatus({ username, userId }: AvatarWithOnlineStatusProps) {
  const onlineContext = useOnline();
  const isOnline = onlineContext?.online?.includes(userId) ?? false;

  return (
    <div className="relative">
      <div className="aspect-square rounded-full overflow-hidden w-10 h-10 text-blue-500 border border-black">
        <Avatar className="h-full w-full">
          <AvatarImage
            src={getGatewayUrl(`/api/v1/user-mgmt/@${username}/avatar?size=large`)}
            className="h-full w-full select-none"
            draggable={false}
          />
          <AvatarFallback>
            <div className="w-full h-full flex justify-center items-center">
              <User className="h-[50%] w-[50%] text-white" />
            </div>
          </AvatarFallback>
        </Avatar>
      </div>
      {/* Online indicator at bottom left */}
      <div
          className={`absolute bottom-0 right-1 w-2 h-2 rounded-full ${
          isOnline ? "bg-green-500" : "bg-red-500"
          }`}
      />
    </div>
  );
}
