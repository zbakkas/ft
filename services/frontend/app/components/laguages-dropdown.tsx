"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLang } from "../context/LangContext";
import { getGatewayUrl } from "@/lib/gateway";

export default function LanguageDropdown({lan}: {lan: string}) {
  const [language, setLanguage] = useState(lan === "eng" ? "English" : "Français");
  const [open, setOpen] = useState(false);
  const { setLang } = useLang()!;

  const languages = ["English", "Français"];

  return (
    <div className="relative inline-block text-left">
      {/* Dropdown button */}
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center px-2 py-1 border-2 border-gray-200 hover:border-gray-400 
                   rounded-lg shadow text-sm font-light transition text-white my-2"
      >
        {language}
        <ChevronDown className="ml-2 h-4 w-4" />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute left-0 w-40 bg-gray-700 border rounded-lg shadow-lg z-10 overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={async () => {
                const res = await fetch(getGatewayUrl("/api/v1/user-mgmt/me"), {
                  method: "PATCH",
                  credentials: "include",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ language: lang === "English" ? "eng" : "fr" }),
                });
                if (res.ok) {
                  setLanguage(lang);
                  setLang(lang === "English" ? "eng" : "fr");
                  setOpen(false);
                }
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-400 ${
                lang === language ? "font-semibold text-blue-600" : ""
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
