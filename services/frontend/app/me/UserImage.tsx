"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { User } from "lucide-react";
import AvatarEditButton from "../components/avatar-edit-button";
import { useAvatar } from "../context/AvatarContext";
import { getGatewayUrl } from "@/lib/gateway";

export default function UserImage() {
    const {version} = useAvatar()!
    return (
        <div className="relative">
            <div className="h-64 aspect-square rounded-full overflow-hidden border-4 border-gray-300">
                <Avatar className="h-full w-full">
                    <AvatarImage
                        src={getGatewayUrl(`/api/v1/user-mgmt/me/avatar?size=large&timestamp=${version}`)}
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
            <AvatarEditButton className="absolute bottom-5 right-5 bg-gray-900 text-white border-2 border-gray-200 text-center flex justify-center items-center" />
        </div>
    );
}