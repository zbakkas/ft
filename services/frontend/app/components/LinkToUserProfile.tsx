"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import NextLink from "next/link";
import { User } from "lucide-react";
import { ReactElement } from "react";
import { useAvatar } from "../context/AvatarContext";
import { getGatewayUrl } from "@/lib/gateway";

export default function LinkToUserProfile(): ReactElement<any, any> {
  const {version} = useAvatar()!;
  return (
    <NextLink href="/me">
      <Avatar className="h-[20px] sm:h-[25px] lg:h-[30px] w-[20px] sm:w-[25px] lg:w-[30px]">
        <AvatarImage
          src={getGatewayUrl(`/api/v1/user-mgmt/me/avatar?size=small&timestamp=${version}`)}
        />
        <AvatarFallback>
          <User className="m-1 sm:m-[5px] lg:m-[6px]" />
        </AvatarFallback>
      </Avatar>
    </NextLink>
  );
}
