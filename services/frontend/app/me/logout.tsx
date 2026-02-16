"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { getGatewayUrl } from "@/lib/gateway";

export default function LogOutButton() {
    const router = useRouter()
    return (
        <div className="cursor-pointer my-1" onClick={() => {
            fetch(getGatewayUrl("/api/v1/auth/logout"), {
                method: "POST",
                credentials: "include",
            }).finally(() => {
                router.push('/')
            })
        }} id="logout">
            <LogOut className="inline mb-1" />
            logout
        </div>
    );
}