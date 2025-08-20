'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import GameDesign_m from './gameDesign';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 15;
const PADDLE_SPEED = 5;
const BALL_SPEED =6;
const COUNTDOWN_TIME = 5; // Countdown time in seconds


export default function MultiplayerPongGame_2D() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const playerIdRef = useRef<string | null>(null);

  const [roomId, setRoomId] = useState<string | null>(null);
  const [messagee, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  

  // Paddle state
  const [P_me_paddleY, setP_me_PaddleY] = useState<number>(200); // Starting position
  const [P_2_paddleY, setP_2_PaddleY] = useState<number>(200); // Starting position
  const keysRef = useRef<Set<string>>(new Set());
  const [player_N, setPlayer_N] = useState<number | null>(null);
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
  const [gameOver, setGameOver] = useState< string |boolean>(false);




  const connectToServer = () => 
  {
    if (connectionStatus === 'connected') {
      // If already connected, disconnect
      if (wsRef.current) {
        wsRef.current.close();
      }
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
    console.log('Attempting to connect to:', wsUrl);

    setConnectionStatus('connecting');

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Connected to WebSocket');
      setConnectionStatus('connected');
      setIsLoading(true);
    };

    ws.onmessage = (event) => {
      console.log('📨 Received message from server:', event.data);

      try {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('❌ WebSocket disconnected', event.code, event.reason);
      setConnectionStatus('disconnected');
      setPlayerId(null);
      setMessage(null);
      wsRef.current = null;
      setRoomId(null);
      setPlayer_N(null);
      setIsLoading(false);
      setGameRunning(false);
      setopenTheGame(false);
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setConnectionStatus('disconnected');
      wsRef.current = null;
    };
  };
  
  const handleServerMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'matchFound':
        setMessage(data.message);
        setRoomId(data.gameId);
        setIsLoading(false);
        setPlayer_N(data.playerIndex + 1);
        setopenTheGame(true);
        console.log(`Match found! Room ID: ${data.gameId}`);

        if (data.players) {
          const myPlayer = data.players.find((p: { id: string | null; }) => p.id === playerId);
          const opponent = data.players.find((p: { id: string | null; }) => p.id !== playerId);
          
          if (myPlayer) setP_me_PaddleY(myPlayer.paddleY);
          if (opponent) setP_2_PaddleY(opponent.paddleY);
          console.log('Game state updated:', { myPlayer, opponent });
        }
        break;
      case 'opponentDisconnected':
        // setMessage(data.message);
        setGameOver(data.message);
        setIsLoading(false);
        // setRoomId(null);
        setGameRunning(false);
        // setopenTheGame(false);
        console.log('Opponent disconnected:', data.message);
        break;
      case 'gameStarted':
        setMessage(data.message);
        setIsLoading(false);
        setGameRunning(true);
        console.log('Game started:', data.message);
        break;
      case 'waitingForOpponent':
        setMessage(data.message);
        console.log(`Waiting for opponent: ${data.message}`);
        break;
      case 'playerId':
          playerIdRef.current = data.playerId; // ✅ instant availability
          setPlayerId(data.playerId);          // ✅ triggers re-render for UI
          console.log(`🎮 Your player ID in B: ${playerId}`);
          console.log(`🎮 Your player ID in S: ${data.playerId}`);
        break;
      case 'gameState':
        const myId = playerIdRef.current;
        if (!myId) return; // now this will work after first message
      
        if (data.gameState?.players) {
          const myPlayer = data.gameState.players.find((p: any) => p.id === myId);
          const opponent = data.gameState.players.find((p: any) => p.id !== myId);
      
          if (myPlayer)
          {
            setP_me_PaddleY(myPlayer.paddleY);
            setMyScore(myPlayer.score);
          } 
          if (opponent) 
          {
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
        console.log('Game Over:', data.message);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }, [playerId]);

  

  // Send paddle movement to server (with throttling)
  const sendPaddleMove = useCallback((direction: 'up' | 'down') => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const now = Date.now();
    if (lastPaddleMove.current && 
        lastPaddleMove.current.direction === direction && 
        now - lastPaddleMove.current.time < 16) { // ~60fps throttling
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'paddleMove',
      direction,
    }));

    lastPaddleMove.current = { direction, time: now };
  }, []);

  

  // Handle continuous key presses
  useEffect(() => {
    const handleMovement = () => {
      if (keysRef.current.has('w') || keysRef.current.has('ArrowUp')) {
        sendPaddleMove('up');
      }
      if (keysRef.current.has('s') || keysRef.current.has('ArrowDown')) {
        sendPaddleMove('down');
      }
    };

    const intervalId = setInterval(handleMovement, 16); // ~60fps

    return () => clearInterval(intervalId);
  }, [sendPaddleMove]);

  // Keyboard event handlers
  useEffect(() => 
  {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 's' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        keysRef.current.add(e.key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    console.log('⚽️⚽️Component mounted, connecting to server...');
    connectToServer();
  }, []);

  const disconnectFromServer = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setConnectionStatus('disconnected');
      setPlayerId(null);
      setMessage(null);
      setRoomId(null);
      setIsLoading(false);
      setPlayer_N(null);
      setGameRunning(false);
      setopenTheGame(false);
    }
  };


  return (
    <div>
        <GameDesign_m
          BALL_SIZE={BALL_SIZE}
          PADDLE_HEIGHT={PADDLE_HEIGHT}
          PADDLE_WIDTH={PADDLE_WIDTH}
          connectionStatus={connectionStatus}
          CANVAS_WIDTH={CANVAS_WIDTH}
          CANVAS_HEIGHT={CANVAS_HEIGHT}
          disconnectFromServer={disconnectFromServer}
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
        />
    </div>
  );
}