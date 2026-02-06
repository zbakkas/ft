"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogOutButton() {
    const router = useRouter()
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    return (
        <div className="cursor-pointer my-1" onClick={() => {
            fetch(`${API_URL}/api/v1/auth/logout`, {
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