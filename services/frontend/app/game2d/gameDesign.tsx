import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLang } from "@/app/context/LangContext";

export interface UserProfile {
  username: string;
  avatarUrl: string;
}

type GameDesignProps = {
  BALL_SIZE: number;
  PADDLE_HEIGHT: number;
  PADDLE_WIDTH: number;
  connectionStatus: string;
  CANVAS_WIDTH: number;
  CANVAS_HEIGHT: number;
  disconnectFromServer: () => void;
  playerId: string | null;
  roomId: string | null;
  messagee: string | null;
  isLoading: boolean;
  openTheGame: boolean;
  P_me_paddleY: number;
  P_2_paddleY: number;
  gameRunning: boolean;
  ballX: number;
  ballY: number;
  myScore: number;
  opponentScore: number;
  COUNTDOWN_TIME: number;
  gameOver: string | boolean;
  myProfile: UserProfile | null;
  opponentProfile: UserProfile | null;
  tournamentId: string | null;
  isPrivate: boolean;
  inviterId: string | null;
};

export default function GameDesign_m({
  BALL_SIZE,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  connectionStatus,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  disconnectFromServer,
  playerId,
  roomId,
  messagee,
  isLoading,
  openTheGame,
  P_me_paddleY,
  P_2_paddleY,
  gameRunning,
  ballX,
  ballY,
  myScore,
  opponentScore,
  COUNTDOWN_TIME,
  gameOver,
  myProfile,
  opponentProfile,
  tournamentId,
  isPrivate,
  inviterId
}: GameDesignProps) {

  const router = useRouter();
  const { lang } = useLang()!;
  const [countdown, setCountdown] = useState<number | null>(null);

  // Determine navigation path and button text based on game context
  const getReturnPath = () => {
    if (tournamentId) {
      return '/tournament';
    } else if (isPrivate && opponentProfile?.username) {
      return `/users/${opponentProfile.username}`;
    }
    return '/';
  };

  const getReturnButtonText = () => {
    if (tournamentId) {
      return lang === "eng" ? "Return to Tournament" : "Retour au Tournoi";
    } else if (isPrivate && opponentProfile?.username) {
      return lang === "eng" ? "Return to Chat" : "Retour au Chat";
    }
    return lang === "eng" ? "Return to Home" : "Retour à l'accueil";
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (openTheGame && !gameRunning && !gameOver) {
      setCountdown(COUNTDOWN_TIME);
      timer = setInterval(() => {
        setCountdown(prevCount => {
          if (prevCount === null) return null;
          if (prevCount <= 1) {
            clearInterval(timer);
            return null;
          }
          return prevCount - 1;
        });
      }, 1000);
    } else {
      setCountdown(null);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [openTheGame, gameRunning, gameOver, COUNTDOWN_TIME]);

  // Dynamic status color
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      default: return 'text-red-400';
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black flex flex-col items-center justify-center p-4 font-mono relative">
      
      {/* --- BACK BUTTON --- */}
      <div className="absolute top-6 left-6 z-50">
          <button 
              onClick={() => {
                      disconnectFromServer();
                      router.push(getReturnPath());
                    }}
              // href="/" 
              className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all duration-300 group"
          >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold text-sm tracking-wide uppercase">{tournamentId ? (lang === "eng" ? "Tournament" : "Tournoi") : (isPrivate && opponentProfile?.username) ? (lang === "eng" ? "Chat" : "Chat") : (lang === "eng" ? "Home" : "Accueil")}</span>
          </button>
      </div>

      {/* --- LOBBY / LOADING SCREEN --- */}
      {!openTheGame && (
        <div className="relative z-10 w-full max-w-md bg-gray-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl text-center">
          <div className="mb-8 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <h1 className="relative text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tighter">
              NEON PONG
            </h1>
          </div>
          
          <div className={`text-sm font-bold uppercase tracking-widest mb-4 ${getStatusColor()}`}>
            ● {connectionStatus}
          </div>
          
          {messagee && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
               <p className="text-cyan-300 animate-pulse">{messagee}</p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center my-6 space-y-4">
              <div className="relative w-16 h-16">
                 <div className="absolute top-0 left-0 w-full h-full border-4 border-cyan-500/30 rounded-full"></div>
                 <div className="absolute top-0 left-0 w-full h-full border-4 border-t-cyan-400 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-400 text-xs">{lang === "eng" ? "Waiting for opponent..." : "En attente d'un adversaire..."}</p>
            </div>
          )}

           {/* User Profile Preview */}
           {myProfile && (
             <div className="flex items-center bg-gray-800/80 rounded-full p-2 pr-6 mx-auto w-fit border border-gray-700 mt-4">
                <img 
                  src={myProfile.avatarUrl || '/default-avatar.png'} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full border border-cyan-500 object-cover mr-3"
                />
                <div className="text-left">
                  <p className="text-xs text-gray-400">{lang === "eng" ? "Logged in as" : "Connecté en tant que"}</p>
                  <p className="text-cyan-400 font-bold text-sm">{myProfile.username}</p>
                </div>
             </div>
          )}
          
          {connectionStatus === 'connected' && (
            <button 
              onClick={disconnectFromServer}
              className="mt-8 w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 hover:border-red-500 rounded-lg transition-all duration-300 text-sm font-bold uppercase tracking-wider"
            >
              {lang === "eng" ? "Cancel Matchmaking" : "Annuler l'appairage"}
            </button>
          )}
        </div>
      )}

      {/* --- GAME ARENA --- */}
      {openTheGame && (
        <div className="w-full max-w-5xl animate-in fade-in duration-700">
          
          {/* Scoreboard */}
          <div className="flex justify-between items-end mb-4 px-8 py-4 bg-gray-900/60 backdrop-blur-md border border-white/5 rounded-2xl mx-auto max-w-4xl">
              {/* Player 1 */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute -inset-2 bg-cyan-500 rounded-full blur opacity-20"></div>
                  <img src={myProfile?.avatarUrl} className="w-16 h-16 rounded-full border-2 border-cyan-400 relative z-10 object-cover" alt="Me" />
                </div>
                <div>
                  <h3 className="text-cyan-400 font-bold text-lg">{myProfile?.username || (lang === "eng" ? "YOU" : "VOUS")}</h3>
                  <p className="text-4xl font-black text-white tabular-nums drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">{myScore}</p>
                </div>
              </div>

              <div className="text-gray-600 font-black text-2xl italic">{lang === "eng" ? "VS" : "VS"}</div>

              {/* Player 2 */}
              <div className="flex items-center space-x-4 flex-row-reverse space-x-reverse">
                <div className="relative">
                  <div className="absolute -inset-2 bg-purple-500 rounded-full blur opacity-20"></div>
                  <img src={opponentProfile?.avatarUrl} className="w-16 h-16 rounded-full border-2 border-purple-400 relative z-10 object-cover" alt="Opp" />
                </div>
                <div className="text-right">
                  <h3 className="text-purple-400 font-bold text-lg">{opponentProfile?.username || (lang === "eng" ? "OPPONENT" : "ADVERSAIRE")}</h3>
                  <p className="text-4xl font-black text-white tabular-nums drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]">{opponentScore}</p>
                </div>
              </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="relative p-1 rounded-xl bg-gradient-to-b from-gray-700 to-gray-900 shadow-2xl mx-auto" style={{ width: CANVAS_WIDTH + 8 }}>
            <div 
              className="relative bg-gray-900 rounded-lg overflow-hidden cursor-none"
              style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
            >
              {/* Background Grid Effect */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}></div>

              {/* Center Line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-700/50 -translate-x-1/2 border-r border-dashed border-gray-600"></div>

              {/* PADDLE 1 (Cyan) */}
              <div
                className="absolute bg-cyan-400 rounded-r-md shadow-[0_0_15px_rgba(34,211,238,0.6)] z-20"
                style={{
                  left: 0,
                  top: P_me_paddleY,
                  width: PADDLE_WIDTH,
                  height: PADDLE_HEIGHT,
                  transition: 'top 0.1s linear' // Keep paddle smooth
                }}
              />

              {/* PADDLE 2 (Purple) */}
              <div
                className="absolute bg-purple-500 rounded-l-md shadow-[0_0_15px_rgba(168,85,247,0.6)] z-20"
                style={{
                  left: CANVAS_WIDTH - PADDLE_WIDTH,
                  top: P_2_paddleY,
                  width: PADDLE_WIDTH,
                  height: PADDLE_HEIGHT,
                  transition: 'top 0.1s linear' // Keep paddle smooth
                }}
              />

              {/* BALL - UPDATED LOGIC HERE */}
              {!gameOver && (
                <div
                  className="absolute rounded-full bg-white z-10"
                  style={{
                    left: ballX,
                    top: ballY,
                    width: BALL_SIZE,
                    height: BALL_SIZE,
                    // NO TRANSITION for the ball to prevent lag/floaty feel
                    // Added a stronger glow effect
                    boxShadow: '0 0 15px 2px rgba(255, 255, 255, 0.8), 0 0 30px 5px rgba(34, 211, 238, 0.4)' 
                  }}
                />
              )}

              {/* COUNTDOWN OVERLAY */}
              {countdown !== null && countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 backdrop-blur-sm">
                  <span className="text-9xl font-black text-white animate-ping">{countdown}</span>
                </div>
              )}

              {/* GAME OVER OVERLAY */}
              {gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30 backdrop-blur-md p-8 text-center">
                  <h2 className="text-5xl font-black text-white mb-2 uppercase tracking-tighter">
                    {lang === "eng" ? "Game Over" : "Jeu Terminé"}
                  </h2>
                  <p className="text-xl text-cyan-300 mb-8 max-w-md">{gameOver}</p>
                  <button 
                    onClick={() => {
                      disconnectFromServer();
                      router.push(getReturnPath());
                    }}
                    className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest hover:bg-cyan-400 hover:scale-105 transition-all duration-200 rounded-none transform skew-x-[-10deg]"
                  >
                    {getReturnButtonText()}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}