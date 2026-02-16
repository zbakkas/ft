import PlayerProgressCard from "@/app/components/player-progress-card";
import RlManager from "./RlManager";
import Error from "@/app/components/Error";
import ChatInterface from "./chatInterface";
import AvatarWithOnlineStatus from "./AvatarWithOnlineStatus";
import MatcheHistory from "@/app/components/MatcheHistory";
import { getGatewayUrl } from "@/lib/gateway";

export default async function Dashboard( username: string, token: string | null) {
  const res = await fetch(getGatewayUrl(`/api/v1/user-mgmt/@${username}`), {
    headers: {
      Cookie: `token=${token}`,
    },
  });
  if (!res.ok) {
    return (<Error code={res.status} />);
  }
  const data = await res.json();
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
          <AvatarWithOnlineStatus username={username} userId={data.id} />
          <div className="border-2 border-white sm:ml-4 mt-4 sm:mt-0 rounded-xl h-full w-full flex flex-col justify-center items-center text-white">
            <h1 className="my-2 text-4xl font-bold">{username}</h1>
            <RlManager username={username} />
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
        <div className="overflow-auto flex-1 w-full border-2 border-gray-400 rounded-lg bg-gradient-to-br from-black to-gray-900 col-span-1 lg:col-span-4 row-span-3">
          <div className="p-2 h-full">
            <ChatInterface username={username} currentUserId={data.id} uid={data.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
