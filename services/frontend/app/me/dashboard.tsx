import PlayerProgressCard from "@/app/components/player-progress-card";
import { cookies } from "next/dist/server/request/cookies";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import LogOutButton from "./logout";
import RelationshipManager from "./rlmanager";
import UserImage from "./UserImage";
import Translated from "./Translated";
import MatcheHistory from "../components/MatcheHistory";
import { getGatewayUrl } from "@/lib/gateway";

export default async function Dashboard() {
  const cookieStore: ReadonlyRequestCookies = await cookies();
  const token: string | null = cookieStore.get("token")?.value || null;
  let res = await fetch(getGatewayUrl("/api/v1/user-mgmt/me"), {
      headers: {
        Cookie: `token=${token}`,
      },
  });
  let data = await res.json();
  const username = data.username;
  let history: any = await fetch(getGatewayUrl(`/api/v1/game/game-results/${data.id}`), {
    headers: {
      Cookie: `token=${token}`,
    },
  });
  history = await history.json();
  return (
    <div
      className="w-full flex-grow bg-black flex justify-center items-center p-4 sm:p-6 lg:p-8"
      style={{ fontFamily: "'Orbitron', 'Courier New', monospace" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-8 gap-4 sm:gap-6 lg:gap-6 min-h-[790px] max-w-[1350px] w-full auto-cols-auto auto-rows-[135px]">
        <div className="relative p-4 flex flex-col sm:flex-row items-center justify-center w-full border-2 border-gray-400 rounded-lg bg-gradient-to-br from-black to-gray-900 col-span-1 lg:col-span-5 row-span-4 sm:row-span-2">
          <div
            className="w-full h-full absolute inset-0 opacity-10 z-[-1]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 8px,
                            rgba(255,255,255,0.2) 8px,
                            rgba(255,255,255,0.2) 16px
                          )`,
            }}
          ></div>
          <UserImage />
          <div className="border-2 border-white sm:ml-4 mt-4 sm:mt-0 rounded-xl h-full w-full flex justify-center items-center">
            <div className="p-6 w-fit h-fit text-white text-center">
              <h1 className="text-4xl font-bold">{username}</h1>
              {/* <Switch2FA /> */}
              <Translated />
              <LogOutButton />
            </div>
          </div>
        </div>
        <div className="relative border-2 border-gray-400 rounded-lg bg-gradient-to-br from-black to-gray-900 col-span-1 lg:col-span-3 row-span-2">
          <div
            className="w-full h-full absolute inset-0 opacity-10 z-[-1]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 8px,
                            rgba(255,255,255,0.2) 8px,
                            rgba(255,255,255,0.2) 16px
                          )`,
            }}
          ></div>
          <PlayerProgressCard playerId={data.id} history={history.data} />
        </div>
        <div className="relative flex-1 w-full border-2 border-gray-400 rounded-lg bg-gradient-to-br from-black to-gray-900 col-span-1 lg:col-span-4 row-span-3">
          <div
            className="w-full h-full absolute inset-0 opacity-10 z-[-1]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 8px,
                            rgba(255,255,255,0.2) 8px,
                            rgba(255,255,255,0.2) 16px
                          )`,
            }}
          ></div>
          <MatcheHistory playerId={data.id} history={history.data} />
        </div>
        <div className="relative flex-1 w-full border-2 border-gray-400 rounded-lg bg-gradient-to-br from-black to-gray-900 col-span-1 lg:col-span-4 row-span-3">
          <div
            className="w-full h-full absolute inset-0 opacity-10 z-[-1]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 8px,
                            rgba(255,255,255,0.2) 8px,
                            rgba(255,255,255,0.2) 16px
                          )`,
            }}
          ></div>
          <RelationshipManager />
        </div>
      </div>
    </div>
  );
}
