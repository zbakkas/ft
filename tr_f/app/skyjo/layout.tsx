import "./globals.css";
import { SocketProvider } from "./contexts/SocketContext";

export default function SkyjoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SocketProvider>
      {children}
    </SocketProvider>
  );
}
