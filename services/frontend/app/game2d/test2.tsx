'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import GameDesign_m, { UserProfile } from './gameDesign';
import { useSearchParams } from 'next/navigation';
import { getGatewayUrl, getWsGatewayUrl } from "@/lib/gateway";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 16;
const COUNTDOWN_TIME = 5; 

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

export default function MultiplayerPongGame_2D() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  // Player Identification
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const playerIdRef = useRef<string | null>(null);

  // Profiles
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [opponentProfile, setOpponentProfile] = useState<UserProfile | null>(null);

  // Game State
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messagee, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [gameRunning, setGameRunning] = useState<boolean>(false);
  const [openTheGame, setopenTheGame] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<string | boolean>(false);

  // Physics State
  const [P_me_paddleY, setP_me_PaddleY] = useState<number>(200); 
  const [P_2_paddleY, setP_2_PaddleY] = useState<number>(200); 
  const [ballX, setBallX] = useState<number>(CANVAS_WIDTH / 2);
  const [ballY, setBallY] = useState<number>(CANVAS_HEIGHT / 2);
  const [myScore, setMyScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);

  // Input Handling
  const keysRef = useRef<Set<string>>(new Set());
  const lastPaddleMove = useRef<{ direction: string; time: number } | null>(null);

  ///
  const searchParams = useSearchParams();
  const get_privatee = searchParams.get('privatee');
  const get_roomId = searchParams.get('roomId'); 
  const get_playerinvitID = searchParams.get('playerinvitId');
  const get_tournamentId = searchParams.get('tournamentId');

  const connectToServer = () => {
    if (connectionStatus === 'connected' || wsRef.current) return;

    const wsUrl = getWsGatewayUrl(`/ws/game/ws?privatee=${get_privatee}&roomId=${get_roomId}&player_two_Id=${get_playerinvitID}&tournamentId=${get_tournamentId}`);
    setConnectionStatus('connecting');

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Connected to WebSocket');
      setConnectionStatus('connected');
      setIsLoading(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onclose = () => handleDisconnect();
    ws.onerror = () => {
      console.error('❌ WebSocket error');
      handleDisconnect();
    };
  };

  const handleDisconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setConnectionStatus('disconnected');
    setPlayerId(null);
    setOpponentId(null);
    setMessage(null);
    wsRef.current = null;
    setRoomId(null);
    setIsLoading(false);
    setGameRunning(false);
    setopenTheGame(false);
    setMyProfile(null);
    setOpponentProfile(null);
  };
  
  const handleServerMessage = useCallback(async (data: any) => {
    switch (data.type) {
      case '2tap_opened':
        setMessage("You open 2 taps"); 
        setIsLoading(false);
        setopenTheGame(false); 
        // Force disconnect so they can't play in this state if desired
        if (wsRef.current) wsRef.current.close();
        break;

      case 'error':
        setMessage(data.message);
        setIsLoading(false);
        setopenTheGame(false);
        setGameOver(data.message);
        if (wsRef.current) wsRef.current.close();
        break;

      case 'tournamentNotFound':
        setMessage(data.message || "Tournament match not found");
        setIsLoading(false);
        setopenTheGame(false);
        setGameOver(data.message || "You are not invited to this tournament");
        if (wsRef.current) wsRef.current.close();
        break;

      case 'matchFound':
        setMessage(data.message);
        setRoomId(data.gameId);
        setIsLoading(false);
        setopenTheGame(true);

        const players = data.gameState?.players || data.players;
        if (players) {
          const currentMyId = playerIdRef.current || data.playerId;
          const opponent = players.find((p: { id: string }) => p.id !== currentMyId);
          
          if (opponent) {
            setOpponentId(opponent.id);
            const profile = await fetchUserProfile(opponent.id);
            setOpponentProfile(profile);
          }
        }
        break;

      case 'opponentDisconnected':
        setGameOver("Opponent Disconnected");
        setIsLoading(false);
        setGameRunning(false);
        break;

      case 'invitationExpired':
        setGameOver(data.message);
        setIsLoading(false);
        setGameRunning(false);
        if (wsRef.current) wsRef.current.close();
        break;

      case 'gameStarted':
        setMessage(null); // Clear loading message
        setGameRunning(true);
        break;

      case 'waitingForOpponent':
        setMessage(data.message);
        break;

      case 'playerId':
        playerIdRef.current = data.playerId; 
        setPlayerId(data.playerId);          
        const myProf = await fetchUserProfile(data.playerId);
        setMyProfile(myProf);
        break;

      case 'gameState':
        // Only update if game is actually open
        const myId = playerIdRef.current;
        if (!myId) return; 
      
        if (data.gameState?.players) {
          const myPlayer = data.gameState.players.find((p: any) => p.id === myId);
          const opponent = data.gameState.players.find((p: any) => p.id !== myId);
          
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
        setGameRunning(false);
        break;
    }
  }, []);

  // --- Input Logic ---
  const sendPaddleMove = useCallback((direction: 'up' | 'down') => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const now = Date.now();
    // Throttle checks (optional, helps prevent flooding)
    if (lastPaddleMove.current && 
        lastPaddleMove.current.direction === direction && 
        now - lastPaddleMove.current.time < 16) { 
      return;
    }

    wsRef.current.send(JSON.stringify({ type: 'paddleMove', direction }));
    lastPaddleMove.current = { direction, time: now };
  }, []);

  useEffect(() => {
    const handleMovement = () => {
      if (keysRef.current.has('w') || keysRef.current.has('ArrowUp')) sendPaddleMove('up');
      if (keysRef.current.has('s') || keysRef.current.has('ArrowDown')) sendPaddleMove('down');
    };
    const intervalId = setInterval(handleMovement, 16); // 60fps check
    return () => clearInterval(intervalId);
  }, [sendPaddleMove]);

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

  // Initial Connect
  useEffect(() => {
    connectToServer();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return (
    <GameDesign_m
      BALL_SIZE={BALL_SIZE}
      PADDLE_HEIGHT={PADDLE_HEIGHT}
      PADDLE_WIDTH={PADDLE_WIDTH}
      connectionStatus={connectionStatus}
      CANVAS_WIDTH={CANVAS_WIDTH}
      CANVAS_HEIGHT={CANVAS_HEIGHT}
      disconnectFromServer={handleDisconnect}
      playerId={playerId}
      roomId={roomId}
      messagee={messagee}
      isLoading={isLoading}
      openTheGame={openTheGame}
      P_me_paddleY={P_me_paddleY}
      P_2_paddleY={P_2_paddleY}
      gameRunning={gameRunning}
      ballX={ballX}
      ballY={ballY}
      myScore={myScore}
      opponentScore={opponentScore}
      COUNTDOWN_TIME={COUNTDOWN_TIME}
      gameOver={gameOver}
      myProfile={myProfile}
      opponentProfile={opponentProfile}
      tournamentId={get_tournamentId}
      isPrivate={get_privatee === 'true'}
      inviterId={get_playerinvitID}
    />
  );
}