import Image from "next/image";
import SkyjoGame from "./test/lobby";
import GameTable from "./test/game_t";
import NavBar from "./components/NavBar";
import Lobby2 from "./components/main_page";
import SkyjoLobby from "./test/lobby_t";
import JoinRoom from "./room/join_room";
import Error from "@/app/components/Error";
import { verify } from "@/lib/auth";

export default async function Home() {
let isLogged: Boolean = await verify();

  if (!isLogged) {
    return (Error({ code: 401 }));
  }
  return (
    <div className="bg-gradient-to-br h-screen from-slate-900 via-blue-900 to-slate-900">
      <NavBar/>
      <Lobby2/>
      {/* <JoinRoom Room_name="0000" Max_players={8} Password_room=""/> */}
      {/* <SkyjoGame/> */}
      {/* <SkyjoLobby/> */}
      {/* <GameTable/> */}
    </div>
  );
}
