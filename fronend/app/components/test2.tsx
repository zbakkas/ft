'use client';
import { useRef, useState, useEffect, useCallback } from 'react';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;
const PADDLE_SPEED = 5;

export default function MultiplayerPongGame_test2() {
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
  const lastPaddleMove = useRef<{ direction: string; time: number } | null>(null);

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
        setMessage(data.message);
        setIsLoading(true);
        setRoomId(null);
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
      
          if (myPlayer) setP_me_PaddleY(myPlayer.paddleY);
          if (opponent) setP_2_PaddleY(opponent.paddleY);
        }
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }, [playerId]);

  // // Send paddle movement to server (with throttling)
  // const sendPaddleMove = useCallback((direction: 'up' | 'down', newY: number) => {
  //   if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

  //   const now = Date.now();
  //   if (
  //     lastPaddleMove.current &&
  //     lastPaddleMove.current.direction === direction &&
  //     now - lastPaddleMove.current.time < 16
  //   ) {
  //     return;
  //   }

  //   wsRef.current.send(
  //     JSON.stringify({
  //       type: 'paddleMove',
  //       direction,
  //       gameHeight: CANVAS_HEIGHT,
  //       paddleHeight: PADDLE_HEIGHT,
  //       PADDLE_SPEED,
  //     })
  //   );

  //   lastPaddleMove.current = { direction, time: now };
  // }, []);

  // // FIXED: Only update local paddle position if the move is valid, and only send movement if an actual change occurs
  // useEffect(() => {
  //   const updatePaddle = () => {
  //     let newY = P_me_paddleY;
  //     let moved = false;
  //     if (keysRef.current.has('w') || keysRef.current.has('arrowup')) {
  //       if (newY > 0) {
  //         newY = Math.max(0, newY - PADDLE_SPEED);
  //         sendPaddleMove('up', newY);
  //         moved = true;
  //       }
  //     }
  //     if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) {
  //       if (newY < CANVAS_HEIGHT - PADDLE_HEIGHT) {
  //         newY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, newY + PADDLE_SPEED);
  //         sendPaddleMove('down', newY);
  //         moved = true;
  //       }
  //     }
  //     if (moved && newY !== P_me_paddleY) {
  //       setP_me_PaddleY(newY);
  //     }
  //   };
  //   const intervalId = setInterval(updatePaddle, 16); // ~60fps

  //   return () => clearInterval(intervalId);
  // }, [sendPaddleMove, P_me_paddleY]);

  // // Keyboard event handlers
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if (
  //       e.key === 'w' ||
  //       e.key === 's' ||
  //       e.key === 'ArrowUp' ||
  //       e.key === 'ArrowDown'
  //     ) {
  //       keysRef.current.add(e.key.toLowerCase());
  //     }
  //   };

  //   const handleKeyUp = (e: KeyboardEvent) => {
  //     keysRef.current.delete(e.key.toLowerCase());
  //   };

  //   window.addEventListener('keydown', handleKeyDown);
  //   window.addEventListener('keyup', handleKeyUp);

  //   return () => {
  //     window.removeEventListener('keydown', handleKeyDown);
  //     window.removeEventListener('keyup', handleKeyUp);
  //   };
  // }, []);

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
      gameHeight: CANVAS_HEIGHT,
      paddleHeight: PADDLE_HEIGHT,
      PADDLE_SPEED,
    }));

    lastPaddleMove.current = { direction, time: now };
  }, []);

  // const sendPaddleMove = useCallback((direction: 'up' | 'down') => {
  //   if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
  
  //   // Update local paddle position immediately
  //   setP_me_PaddleY(prev => {
  //     let newY = prev;
  //     if (direction === 'up') newY = Math.max(0, prev - PADDLE_SPEED);
  //     else if (direction === 'down') newY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, prev + PADDLE_SPEED);
  //     return newY;
  //   });
  
  //   // Throttle sending to server
  //   const now = Date.now();
  //   if (
  //     lastPaddleMove.current &&
  //     lastPaddleMove.current.direction === direction &&
  //     now - lastPaddleMove.current.time < 16
  //   ) {
  //     return;
  //   }
  
  //   wsRef.current.send(JSON.stringify({
  //     type: 'paddleMove',
  //     direction,
  //     gameHeight: CANVAS_HEIGHT,
  //     paddleHeight: PADDLE_HEIGHT,
  //     PADDLE_SPEED,
  //   }));
  
  //   lastPaddleMove.current = { direction, time: now };
  // }, []);
  

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
    }
  };

  return (
    <div>
      <h1> you are {connectionStatus} </h1>
      {messagee && <h2>{messagee}</h2>}
      {playerId && <h2>Player ID: {playerId}</h2>}

      {isLoading && (
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      )}
      {roomId && <h2>Room ID: {roomId}</h2>}
      {connectionStatus === 'connected' && (
        <button onClick={disconnectFromServer}>disconnected</button>
      )}

      {/* Game Area with Paddle */}
      {gameRunning && (
        <div
          className=" relative bg-black border-2 border-white rotate-0 items-center justify-center  m-auto"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          
        >
          {/* Left Paddle (Your paddle) */}
          <div
            className="absolute bg-green-400"
            style={{
              left: '5px',
              top: `${P_me_paddleY}px`,
              width: `${PADDLE_WIDTH}px`,
              height: `${PADDLE_HEIGHT}px`,
            }}
          />
          {/* Right Paddle (Opponent paddle) */}
          <div
            className="absolute bg-white"
            style={{
              left: `${CANVAS_WIDTH - PADDLE_WIDTH - 5}px`,
              top: `${P_2_paddleY}px`,
              width: `${PADDLE_WIDTH}px`,
              height: `${PADDLE_HEIGHT}px`,
            }}
          />

   {/* Center Line */}
    <div
      className="absolute h-full left-1/2 transform -translate-x-1/2 border-l-2 border-gray-400 border-dashed"
    />
        
        </div>
      )}
    </div>
  );
}