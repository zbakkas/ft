'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { getGatewayUrl, getWsGatewayUrl } from "@/lib/gateway";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useLang } from "@/app/context/LangContext";

export interface UserProfile {
  username: string;
  avatarUrl: string;
}

// --- Utility: Fetch User Data ---
const fetchUserProfile = async (id: string): Promise<UserProfile> => {
  try {
    const response = await fetch(getGatewayUrl(`/api/v1/user-mgmt/${id}`), {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch user');
    
    const data = await response.json();
    const fullAvatarUrl = getGatewayUrl(`/api/v1/user-mgmt/@${data.username}/avatar`);

    return {
      username: data.username,
      avatarUrl: fullAvatarUrl
    };
  } catch (error) {
    console.error(`Error fetching profile for ${id}:`, error);
    // Return a default/fallback profile
    return { 
      username: 'Unknown Player', 
      avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png' 
    }; 
  }
};

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 16;
const COUNTDOWN_TIME = 5;

export default function Game2vs2() {
  const router = useRouter();
  const { lang } = useLang()!;
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const playerIdRef = useRef<string | null>(null);

  const [roomId, setRoomId] = useState<string | null>(null);
  const [messagee, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Paddle state
  const [P_me_paddleY, setP_me_PaddleY] = useState<number>(200); 
  const [P_2_paddleY, setP_2_PaddleY] = useState<number>(200); 
  const keysRef = useRef<Set<string>>(new Set());
  const [player_N, setPlayer_N] = useState<number | null>(null);
  const player_n_ref = useRef<number | null>(null);
  const [gameRunning, setGameRunning] = useState<boolean>(false);
  const [openTheGame, setopenTheGame] = useState<boolean>(false);
  const lastPaddleMove = useRef<{ direction: string; time: number } | null>(null);

  //BALL state
  const [ballX, setBallX] = useState<number>(CANVAS_WIDTH / 2);
  const [ballY, setBallY] = useState<number>(CANVAS_HEIGHT / 2);

  // Scores
  const [myScore, setMyScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);

  //gameover
  const [gameOver, setGameOver] = useState<string | boolean>(false);

  // Player Profiles
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [teammateProfile, setTeammateProfile] = useState<UserProfile | null>(null);
  const [opponent1Profile, setOpponent1Profile] = useState<UserProfile | null>(null);
  const [opponent2Profile, setOpponent2Profile] = useState<UserProfile | null>(null);

  // Countdown state
  const [countdown, setCountdown] = useState<number | null>(null);

  // --- WebSocket Logic ---
  // We define handleServerMessage first so it can be used in connectToServer
  const handleServerMessage = useCallback(async (data: any) => {
    switch (data.type) {
      case 'matchFound':
        setMessage(data.message);
        setRoomId(data.gameId);
        setIsLoading(false);
        setPlayer_N(data.playerIndex + 1);
        player_n_ref.current = data.playerIndex + 1;
        setopenTheGame(true);

        const players = data.players || data.gameState?.players;
        
        if (players && players.length > 0) {
          const myPlayerIndex = data.playerIndex;
          const myPlayer = players.find((p: any) => p.playerIndex === myPlayerIndex);
          
          // Logic to identify Teammate and Opponents based on index
          // Team 1: Index 0 & 1
          // Team 2: Index 2 & 3
          const isTeam1 = myPlayerIndex === 0 || myPlayerIndex === 1;
          const teammateIndex = isTeam1 ? (myPlayerIndex === 0 ? 1 : 0) : (myPlayerIndex === 2 ? 3 : 2);
          
          const teammate = players.find((p: any) => p.playerIndex === teammateIndex);
          const opponents = players.filter((p: any) => 
            isTeam1 ? (p.playerIndex === 2 || p.playerIndex === 3) : (p.playerIndex === 0 || p.playerIndex === 1)
          );
          
          if (player_n_ref.current !== null && (player_n_ref.current === 1 || player_n_ref.current === 2)) setP_me_PaddleY(myPlayer?.paddleY);
          if (player_n_ref.current !== null && (player_n_ref.current === 4 || player_n_ref.current === 3)) setP_2_PaddleY(opponents[0]?.paddleY);
          
          // Fetch profiles
          const fetchPromises = [];
          if (myPlayer?.id) fetchPromises.push(fetchUserProfile(myPlayer.id).then(setMyProfile));
          if (teammate?.id) fetchPromises.push(fetchUserProfile(teammate.id).then(setTeammateProfile));
          if (opponents[0]?.id) fetchPromises.push(fetchUserProfile(opponents[0].id).then(setOpponent1Profile));
          if (opponents[1]?.id) fetchPromises.push(fetchUserProfile(opponents[1].id).then(setOpponent2Profile));
          
          await Promise.all(fetchPromises);
        }
        break;

      case 'opponentDisconnected':
        setGameOver(data.message);
        setIsLoading(false);
        setGameRunning(false);
        break;

      case 'gameStarted':
        setMessage(data.message);
        setIsLoading(false);
        setGameRunning(true);
        break;

      case 'waitingForOpponent':
        setMessage(data.message);
        setIsLoading(true);
        break;

      case 'playerId':
        playerIdRef.current = data.playerId;
        setPlayerId(data.playerId);
        fetchUserProfile(data.playerId).then(setMyProfile);
        break;

      case 'gameState':
        const myId = playerIdRef.current;
        if (!myId) return;
        
        let amIFirstTeam = false;
        if (data.gameState?.players) {
          const myPlayer = data.gameState.players.find((p: any) => p.id === myId);
          if (myPlayer && (myPlayer.playerIndex === 0 || myPlayer.playerIndex === 1)) {
            amIFirstTeam = true;
          }
          
          const opponent = amIFirstTeam 
            ? data.gameState.players.find((p: any) => p.playerIndex === 2 || p.playerIndex === 3) 
            : data.gameState.players.find((p: any) => p.playerIndex === 1 || p.playerIndex === 0);

          if (myPlayer) {
            setP_me_PaddleY(myPlayer.paddleY);
            setMyScore(myPlayer.score);
          } 
          if (opponent) {
            setP_2_PaddleY(opponent.paddleY);
            setOpponentScore(opponent.score);
          }
        }
        setBallX(data.gameState.ballX);
        setBallY(data.gameState.ballY);
        break;

      case 'gameOver':
        setGameOver(data.message);
        setIsLoading(false);
        setGameRunning(false);
        break;
    }
  }, []);

  // FIXED: Connect function now checks ref correctly and handles the handshake inside onopen
  const connectToServer = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = getWsGatewayUrl("/ws/game/ws/2v2");
    setConnectionStatus('connecting');

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Connected to WebSocket');
      setConnectionStatus('connected');
      setIsLoading(true);
      // Send game type immediately upon connection
      ws.send(JSON.stringify({ type: 'gameType', game: '2vs2' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onclose = () => {
      // Only reset state if this specific socket closes (avoids race conditions)
      if (wsRef.current === ws) {
        setConnectionStatus('disconnected');
        setPlayerId(null);
        setMessage(null);
        wsRef.current = null;
        setRoomId(null);
        setPlayer_N(null);
        setIsLoading(false);
        setGameRunning(false);
        setopenTheGame(false);
        setMyProfile(null);
        setTeammateProfile(null);
        setOpponent1Profile(null);
        setOpponent2Profile(null);
      }
    };

    ws.onerror = () => {
      if (wsRef.current === ws) {
        setConnectionStatus('disconnected');
        wsRef.current = null;
      }
    };
  }, [handleServerMessage]);

  const disconnectFromServer = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    // Explicitly reset state
    setConnectionStatus('disconnected');
    setPlayerId(null);
    setMessage(null);
    setRoomId(null);
    setIsLoading(false);
    setPlayer_N(null);
    setGameRunning(false);
    setopenTheGame(false);
    setMyProfile(null);
    setTeammateProfile(null);
    setOpponent1Profile(null);
    setOpponent2Profile(null);
  };

  const sendPaddleMove = useCallback((direction: 'up' | 'down') => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const now = Date.now();
    if (lastPaddleMove.current && 
        lastPaddleMove.current.direction === direction && 
        now - lastPaddleMove.current.time < 16) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'paddleMove2vs2',
      direction,
    }));

    lastPaddleMove.current = { direction, time: now };
  }, []);

  // Countdown effect
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
  }, [openTheGame, gameRunning, gameOver]);

  // Movement loop
  useEffect(() => {
    const handleMovement = () => {
      // Determine which key controls what based on player Index
      if (player_n_ref.current && player_n_ref.current % 2 == 0 && (keysRef.current.has('w') || keysRef.current.has('ArrowUp'))) {
        sendPaddleMove('up');
      }
      if (player_n_ref.current && player_n_ref.current % 2 != 0 && (keysRef.current.has('s') || keysRef.current.has('ArrowDown'))) {
        sendPaddleMove('down');
      }
    };
    const intervalId = setInterval(handleMovement, 16);
    return () => clearInterval(intervalId);
  }, [sendPaddleMove]);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['w','s','ArrowUp','ArrowDown'].includes(e.key)) keysRef.current.add(e.key);
    };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // FIXED: Connection Effect with Cleanup
  useEffect(() => {
    connectToServer();

    // CLEANUP: Close socket on unmount to prevent "ghost" connections (double balls)
    return () => {
        if (wsRef.current) {
            console.log("Cleaning up WebSocket...");
            wsRef.current.close();
            wsRef.current = null;
        }
    };
  }, [connectToServer]);

  // Status Color helper
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      default: return 'text-red-400';
    }
  };

  return (
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black flex flex-col items-center justify-center p-4 font-mono">
      
      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-50">
          <button 
              onClick={() => {
                      disconnectFromServer();
                      router.push('/');
                    }}
              className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all duration-300 group"
          >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold text-sm tracking-wide uppercase">{lang === "eng" ? "Home" : "Accueil"}</span>
          </button>
      </div>

      {/* --- LOBBY SCREEN --- */}
      {!openTheGame && (
        <div className="relative z-10 w-full max-w-md bg-gray-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl text-center">
          <div className="mb-8 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
            <h1 className="relative text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter">
              2 VS 2 PONG
            </h1>
          </div>
          
          <div className={`text-sm font-bold uppercase tracking-widest mb-4 ${getStatusColor()}`}>
            ● {connectionStatus}
          </div>
          
          {messagee && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
              <p className="text-cyan-300 animate-pulse text-sm">{messagee}</p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center my-6 space-y-4">
              <div className="relative w-16 h-16">
                 <div className="absolute top-0 left-0 w-full h-full border-4 border-cyan-500/30 rounded-full"></div>
                 <div className="absolute top-0 left-0 w-full h-full border-4 border-t-cyan-400 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-400 text-xs">{lang === "eng" ? "Waiting for 4 players..." : "En attente de 4 joueurs..."}</p>
            </div>
          )}

          {/* User Profile Preview */}
          {myProfile ? (
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
          ) : (
            playerId && <div className="text-gray-500 text-xs mt-4">{lang === "eng" ? "Loading Profile..." : "Chargement du profil..."}</div>
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
          
          {/* Header Info */}
          <div className="text-center mb-6">
             <div className="inline-block bg-gray-900/60 backdrop-blur border border-white/10 px-6 py-2 rounded-full mb-2">
                <span className="text-gray-400 text-xs uppercase tracking-widest mr-2">{lang === "eng" ? "Room ID" : "ID de la salle"}</span>
                <span className="text-white font-mono">{roomId}</span>
             </div>
             <div className="flex justify-center gap-4">
               <span className="text-yellow-400 font-bold text-sm bg-yellow-400/10 px-3 py-1 rounded border border-yellow-400/20">
                 {lang === "eng" ? "YOU ARE PLAYER" : "VOUS êTES JOUEUR"} #{player_N}
               </span>
               <span className="text-gray-400 font-bold text-sm bg-gray-800 px-3 py-1 rounded border border-gray-700">
                  {lang === "eng" ? "CONTROLS" : "COMMANDES"}: {player_N && player_N % 2 === 0 ? (lang === "eng" ? "W / UP" : "W / HAUT") : (lang === "eng" ? "S / DOWN" : "S / BAS")}
               </span>
             </div>
          </div>

          {/* Scoreboard */}
          <div className="bg-gray-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 mb-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Team 1 (Left - Cyan) */}
            <div className="flex items-center space-x-4 w-full md:w-auto justify-center md:justify-start">
               {/* Team Avatars */}
               <div className="flex -space-x-3">
                  <div className="relative z-10">
                    <img 
                      src={myProfile?.avatarUrl || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} 
                      className="w-14 h-14 rounded-full border-2 border-cyan-400 object-cover shadow-[0_0_15px_rgba(34,211,238,0.5)]" 
                      title={myProfile?.username}
                    />
                  </div>
                  <div className="relative z-0 opacity-80 scale-90">
                     <img 
                      src={teammateProfile?.avatarUrl || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} 
                      className="w-14 h-14 rounded-full border-2 border-cyan-600 object-cover" 
                      title={teammateProfile?.username}
                    />
                  </div>
               </div>
               <div>
                  <h3 className="text-cyan-400 font-bold text-sm tracking-wider">{lang === "eng" ? "TEAM BLUE" : "ÉQUIPE BLEU"}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-gray-400">{myProfile?.username}</span>
                    <span className="text-xs text-gray-500">&</span>
                    <span className="text-xs text-gray-400">{teammateProfile?.username}</span>
                  </div>
               </div>
               <div className="text-5xl font-black text-white ml-4 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">{myScore}</div>
            </div>

            {/* VS Badge / Disconnect */}
            <div className="flex flex-col items-center gap-2">
               <span className="text-gray-600 font-black text-3xl italic">{lang === "eng" ? "VS" : "VS"}</span>
               <button 
                 onClick={disconnectFromServer}
                 className="text-xs text-red-400 hover:text-red-300 underline"
               >
                 {lang === "eng" ? "Quit" : "Quitter"}
               </button>
            </div>

             {/* Team 2 (Right - Purple) */}
             <div className="flex items-center space-x-4 flex-row-reverse space-x-reverse w-full md:w-auto justify-center md:justify-start">
               <div className="text-5xl font-black text-white mr-4 drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]">{opponentScore}</div>
               <div>
                  <h3 className="text-purple-400 font-bold text-sm tracking-wider text-right">{lang === "eng" ? "TEAM PURPLE" : "ÉQUIPE VIOLET"}</h3>
                  <div className="flex items-baseline gap-2 justify-end">
                    <span className="text-xs text-gray-400">{opponent1Profile?.username}</span>
                    <span className="text-xs text-gray-500">&</span>
                    <span className="text-xs text-gray-400">{opponent2Profile?.username}</span>
                  </div>
               </div>
               {/* Team Avatars */}
               <div className="flex -space-x-3 flex-row-reverse space-x-reverse">
                  <div className="relative z-10">
                    <img 
                      src={opponent1Profile?.avatarUrl || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} 
                      className="w-14 h-14 rounded-full border-2 border-purple-400 object-cover shadow-[0_0_15px_rgba(168,85,247,0.5)]" 
                      title={opponent1Profile?.username}
                    />
                  </div>
                  <div className="relative z-0 opacity-80 scale-90">
                     <img 
                      src={opponent2Profile?.avatarUrl || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} 
                      className="w-14 h-14 rounded-full border-2 border-purple-600 object-cover" 
                      title={opponent2Profile?.username}
                    />
                  </div>
               </div>
            </div>
          </div>

          {/* Game Canvas Wrapper */}
          <div className="relative p-1 rounded-xl bg-gradient-to-b from-gray-700 to-gray-900 shadow-2xl mx-auto" style={{ width: CANVAS_WIDTH + 8 }}>
            <div 
              className="relative bg-gray-900 rounded-lg overflow-hidden cursor-none outline-none"
              style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
              tabIndex={0}
              onFocus={(e) => e.currentTarget.style.outline = 'none'}
            >
              {/* Background Grid */}
              <div className="absolute inset-0 opacity-10" style={{
                   backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)',
                   backgroundSize: '40px 40px'
              }}></div>

              {/* Center Line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-700/50 -translate-x-1/2 border-r border-dashed border-gray-600"></div>

              {/* Left Paddle (Team 1 - Cyan) */}
              <div
                className="absolute bg-cyan-400 rounded-r-md shadow-[0_0_15px_rgba(34,211,238,0.6)] z-20"
                style={{
                  left: 0,
                  top: P_me_paddleY,
                  width: PADDLE_WIDTH,
                  height: PADDLE_HEIGHT,
                  transition: 'top 0.1s linear'
                }}
              />

              {/* Right Paddle (Team 2 - Purple) */}
              <div
                className="absolute bg-purple-500 rounded-l-md shadow-[0_0_15px_rgba(168,85,247,0.6)] z-20"
                style={{
                  left: CANVAS_WIDTH - PADDLE_WIDTH,
                  top: P_2_paddleY,
                  width: PADDLE_WIDTH,
                  height: PADDLE_HEIGHT,
                  transition: 'top 0.1s linear'
                }}
              />

              {/* Ball */}
              {!gameOver && (
                <div
                  className="absolute rounded-full bg-white z-10"
                  style={{
                    left: ballX,
                    top: ballY,
                    width: BALL_SIZE,
                    height: BALL_SIZE,
                    boxShadow: '0 0 15px 2px rgba(255, 255, 255, 0.8), 0 0 30px 5px rgba(34, 211, 238, 0.4)' 
                    // No transition for ball to avoid lag
                  }}
                />
              )}

              {/* Countdown Overlay */}
              {countdown !== null && countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 backdrop-blur-sm">
                  <span className="text-9xl font-black text-white animate-ping">{countdown}</span>
                </div>
              )}

              {/* Game Over Overlay */}
              {gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30 backdrop-blur-md p-8 text-center">
                  <h2 className="text-5xl font-black text-white mb-2 uppercase tracking-tighter">
                    {gameOver}
                  </h2>
                  <p className="text-cyan-300 mb-8">{lang === "eng" ? "Game Finished" : "Jeu Terminé"}</p>
                  <button 
                    onClick={disconnectFromServer}
                    className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest hover:bg-cyan-400 hover:scale-105 transition-all duration-200"
                  >
                    {lang === "eng" ? "Return to Menu" : "Retour au menu"}
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