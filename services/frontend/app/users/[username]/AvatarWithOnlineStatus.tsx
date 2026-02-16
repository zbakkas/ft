"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { User } from "lucide-react";
import { useOnline } from "@/app/context/OnlineContext";
import { useRl } from "@/app/context/RlContext";
import { getGatewayUrl } from "@/lib/gateway";

interface AvatarWithOnlineStatusProps {
  username: string;
  userId: string;
}

export default function AvatarWithOnlineStatus({ username, userId }: AvatarWithOnlineStatusProps) {
  const onlineContext = useOnline();
  const isOnline = onlineContext?.online?.includes(userId) ?? false;
  const { relation } = useRl()!;

  return (
    <div className="relative">
      <div className="h-64 aspect-square rounded-full overflow-hidden border-4 border-gray-300">
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
      {relation === "friend" ? (
        <div
            className={`absolute bottom-7 right-7 w-5 h-5 rounded-full border-2 border-gray-600 ${
            isOnline ? "bg-green-500" : "bg-red-500"
            }`}
        />
        ) : null}
    </div>
  );
}
