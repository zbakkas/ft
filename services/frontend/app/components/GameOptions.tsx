import { Card, CardContent } from "@/components/ui/card";
import {
  Trophy,
  Users,
  User,
  WifiOff,
  Gift,
  Play,
  Ban,
  Box,
  Bot,
  Handshake,
} from "lucide-react";
import { GameMode } from "../types";
import { ReactElement } from "react";
import { verify } from "@/lib/auth";
import { getLang } from "@/lib/getLang";
import Link from "next/link";

export default async function GameOptions(): Promise<ReactElement<any, any>> {
  let isLogged: Boolean = await verify();

  const gameModes: { [key: string]: GameMode[] } = {
    eng: [
      {
        id: "offline",
        title: "Offline",
        description: "Practice against AI or your friend",
        icon: WifiOff,
        size: "medium",
        players: "1-2 Players",
        mustBeLogged: false,
        actionButtons: [
          "Ai",
          "Vs Friend"
        ],
        links: [
          "/ai",
          "/offline"
        ],
      },
      {
        id: "tournament",
        title: "Tournament",
        description: "Compete against multiple players",
        icon: Trophy,
        size: "medium",
        players: "Multi-player",
        mustBeLogged: true,
        actionButtons: [
          "Play"
        ],
        links: [
          "/tournament"
        ],
      },
      {
        id: "1v1",
        title: "1v1",
        description: "Classic head-to-head battle",
        icon: User,
        size: "medium",
        players: "2 Players",
        mustBeLogged: true,
        actionButtons: [
          "Play"
        ],
        links: [
          "/game2d"
        ],
      },
      {
        id: "3D",
        title: "3D",
        description: "Experience PONG with a 3D flavor",
        icon: Box,
        size: "medium",
        players: "2 Players",
        mustBeLogged: true,
        actionButtons: [
          "Play"
        ],
        links: [
          "/game3d"
        ],
      },
      {
        id: "2v2",
        title: "2v2",
        description: "Team up for doubles action",
        icon: Users,
        size: "medium",
        players: "4 Players",
        mustBeLogged: true,
        actionButtons: [
          "Play"
        ],
        links: [
          "/game2vs2"
        ],
      },
      {
        id: "bonus",
        title: "Bonus Game",
        description: "Special arcade challenges",
        icon: Gift,
        size: "medium",
        players: "Variable",
        mustBeLogged: true,
        actionButtons: [
          "Play"
        ],
        links: [
          "/skyjo"
        ],
      },
    ],
    fr: [
      {
        id: "offline",
        title: "Hors ligne",
        description: "Entraînez-vous contre l'IA ou votre ami",
        icon: WifiOff,
        size: "medium",
        players: "1-2 Joueurs",
        mustBeLogged: false,
        actionButtons: [
          "IA",
          "Vs Ami"
        ],
        links: [
          "/ai",
          "/offline"
        ],
      },
      {
        id: "tournament",
        title: "Tournoi",
        description: "Affrontez plusieurs joueurs",
        icon: Trophy,
        size: "medium",
        players: "Multi-joueur",
        mustBeLogged: true,
        actionButtons: [
          "Jouer"
        ],
        links: [
          "/tournament"
        ],
      },
      {
        id: "1v1",
        title: "1v1",
        description: "Combat classique en tête-à-tête",
        icon: User,
        size: "medium",
        players: "2 Joueurs",
        mustBeLogged: true,
        actionButtons: [
          "Jouer"
        ],
        links: [
          "/game2d"
        ],
      },
      {
        id: "3D",
        title: "3D",
        description: "Vivez PONG avec une touche 3D",
        icon: Box,
        size: "medium",
        players: "2 Joueurs",
        mustBeLogged: true,
        actionButtons: [
          "Jouer"
        ],
        links: [
          "/game3d"
        ],
      },
      {
        id: "2v2",
        title: "2v2",
        description: "Formez une équipe pour un match en double",
        icon: Users,
        size: "medium",
        players: "4 Joueurs",
        mustBeLogged: true,
        actionButtons: [
          "Jouer"
        ],
        links: [
          "/game2vs2"
        ],
      },
      {
        id: "bonus",
        title: "Jeu Bonus",
        description: "Défis d'arcade spéciaux",
        icon: Gift,
        size: "medium",
        players: "Variable",
        mustBeLogged: true,
        actionButtons: [
          "Jouer"
        ],
        links: [
          "/skyjo"
        ],
      },
    ]
  };

  const getCardClasses = (size: string, mustBeLogged: Boolean): string => {
    let baseClasses: string =
      "group relative overflow-hidden border-4 min-h-fit max-h-[400px] border-gray-600";
    if (!mustBeLogged || isLogged) {
      baseClasses +=
        " transition-all duration-300 hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-[1.03] transform-gpu";
    } else {
      baseClasses += " cursor-not-allowed";
    }

    const sizeClasses = {
      large:
        "col-span-1 sm:col-span-2 lg:col-span-3 row-span-1 bg-gradient-to-br from-black to-gray-900",
      medium:
        "col-span-1 sm:col-span-2 lg:col-span-2 row-span-1 bg-gradient-to-br from-gray-900 to-black",
      small:
        "col-span-1 sm:col-span-1 lg:col-span-1 row-span-1 bg-gradient-to-br from-gray-800 to-gray-900",
    };

    return `${baseClasses} ${sizeClasses[size as keyof typeof sizeClasses]}`;
  };

  const lang = await getLang()

  return (
    <div
      className="w-full flex-grow bg-black flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8"
      style={{ fontFamily: "'Orbitron', 'Courier New', monospace" }}
    >
      <div className="flex-1 flex items-center justify-center w-full max-w-[1350px]">
        <div className="grid auto-rows-auto grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6 lg:gap-8 min-h-[790px] w-full">
          
          {gameModes[lang].map((mode) => {
            const Icon = mode.icon;
            return (
              <Card
                key={mode.id}
                className={getCardClasses(mode.size, mode.mustBeLogged)}
              >
                <CardContent className="p-0 h-full flex flex-col justify-between">
                  <div className="absolute inset-0 opacity-10">
                    <div
                      className="w-full h-full"
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
                  </div>

                  <div className="relative z-10 p-4 sm:p-5 lg:p-6 flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className={
                          "p-4 rounded-lg backdrop-blur-sm border border-white/30" +
                          (isLogged || !mode.mustBeLogged
                            ? " transition-all bg-white/20 duration-300 group-hover:bg-white/40 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                            : "")
                        }
                      >
                        <Icon className="w-10 h-10 text-white drop-shadow-lg" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl lg:text-2xl font-black text-white tracking-[0.1em] drop-shadow-lg">
                          {mode.title}
                        </h3>
                        {mode.size === "large" && (
                          <p className="text-gray-100 mt-2 font-semibold tracking-wide">
                            {mode.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {mode.size !== "large" && (
                      <p className="text-gray-100 mb-4 font-semibold tracking-wide">
                        {mode.description}
                      </p>
                    )}

                    <div className="mt-auto space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 font-bold tracking-wide">
                          PLAYERS:
                        </span>
                        <span className="text-white font-black tracking-wide">
                          {mode.players}
                        </span>
                      </div>
                    </div>

                    <div
                      className={
                        "mt-6 opacity-90 translate-y-2" +
                        (isLogged || !mode.mustBeLogged
                          ? " transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
                          : "")
                      }
                    >
                      {mode.id === "offline" ? (
                        <div className="flex gap-5">
                          <Link href={mode.links[0]} className="w-full bg-white text-black py-3 px-4 rounded-lg font-black text-base tracking-[0.1em] flex items-center justify-center gap-2 border-2 border-white transition-all duration-200 hover:bg-gray-100 shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)]">
                            <button
                              className="w-full h-full flex items-center justify-center gap-2"
                            >
                              <Bot className="w-6 h-6" />
                              {mode.actionButtons[0]}
                            </button>
                          </Link>
                          <Link href={mode.links[1]} className="w-full bg-white text-black py-3 px-4 rounded-lg font-black text-base tracking-[0.1em] flex items-center justify-center gap-2 border-2 border-white transition-all duration-200 hover:bg-gray-100 shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)]">
                            <button
                              className="w-full h-full flex items-center justify-center gap-2"
                            >
                              <Handshake className="w-5 h-5" />
                              {mode.actionButtons[1]}
                            </button>
                          </Link>
                        </div>
                      ) : isLogged || !mode.mustBeLogged ? (
                        <Link href={mode.links[0]} className="w-full flex items-center justify-center gap-3">
                        <button
                          className="w-full text-black py-3 px-6 rounded-lg font-black text-lg tracking-[0.1em] flex items-center justify-center gap-3 border-white bg-white transition-all duration-200 hover:bg-gray-100 border-2 shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)]"
                        >
                          <Play className="w-5 h-5" />
                          {mode.actionButtons[0]}
                        </button>
                        </Link>
                      ) : (
                        <button
                          className="w-full text-black py-3 px-6 rounded-lg font-black text-lg tracking-[0.1em] flex items-center justify-center gap-3 border-white bg-gray-600 cursor-not-allowed"
                        >
                          <Ban className="w-5 h-5" />
                          Login to play!
                        </button>
                      )
                    }
                    </div>
                  </div>
                  {isLogged || !mode.mustBeLogged ? (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                  ) : (
                    <></>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
