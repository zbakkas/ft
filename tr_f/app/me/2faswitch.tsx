"use client";

import { useState } from "react";
import { Check, User, X } from "lucide-react";

export default function Switch2FA() {
    const [enabled, setEnabled] = useState(false);

    return (
        <div className="flex align-middle">
            <button
                onClick={() => setEnabled(!enabled)}
                className={`relative inline-flex items-center h-4 w-7 rounded-full transition 
                ${enabled ? "bg-gray-700" : "bg-gray-400"}`}
            >
                <span
                className={`absolute left-1 top-1 w-2 h-2 rounded-full bg-white flex items-center justify-center 
                transition transform ${enabled ? "translate-x-3" : ""}`}
                >
                {enabled ? <Check size={12} /> : <X size={12} />}
                </span>
            </button>
            <div className="text-[14px] mx-1"> 2FA</div>
        </div>
    )
}