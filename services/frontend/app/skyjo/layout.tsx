import "./globals.css";
import { SocketProvider } from "./contexts/SocketContext";
import Error from "@/app/components/Error";
import { verify } from "@/lib/auth";

export default async function SkyjoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  let isLogged: Boolean = await verify();

  if (!isLogged) {
    return (Error({ code: 401 }));
  }
  return (
    <SocketProvider>
      {children}
    </SocketProvider>
  );
}
