import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AvatarContextProvider } from "./context/AvatarContext";
import { LangContextProvider } from "./context/LangContext";
import { getLang } from "@/lib/getLang";
import { getFriends } from "@/lib/getFriends";

export const metadata: Metadata = {
  title: "transcendence",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getLang();
  const friends = await getFriends();

  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body style={{ scrollbarColor: "gray transparent", backgroundColor: "black", height: "100vh" }}>
        <LangContextProvider initialLang={lang}>
        <AvatarContextProvider>
          {children}
        </AvatarContextProvider>
        </LangContextProvider>
      </body>
    </html>
  );
}
