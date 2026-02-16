import NextLink from "next/link";
import NotificationPopover from "./NotificationPopover";
import UserSearchPopover from "./SearchUsersPopover";
import LinkToUserProfile from "./LinkToUserProfile";
import LoginButton from "./LoginButton";
import { ReactElement } from "react";
import { verify } from "@/lib/auth";

export default async function NavBar(): Promise<ReactElement<any, any>> {
  let isLogged: Boolean = await verify();

  return (
    <nav className="flex justify-center w-full h-16 bg-gray-950 pt-2 pb-2 pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8">
      <div className= {
          isLogged ?
          "flex flex-grow max-w-[1350px] justify-between items-center" :
          "flex flex-grow max-w-[1350px] justify-end items-center"
        }
      >
        {isLogged && <UserSearchPopover />}
        <NextLink
          href="/"
          className="h-[16px] sm:h-[23px] lg:h-[28px] absolute left-1/2 transform -translate-x-1/2"
        >
          <img src="/images/PONG.png" alt="PONG" className="w-full h-full" />
        </NextLink>
        {isLogged ? (
          <div className="flex justify-between items-center w-14 sm:w-16 lg:w-20">
            <NotificationPopover />
            <LinkToUserProfile />
          </div>
        ) : (
          <LoginButton />
        )}
      </div>
    </nav>
  );
}
