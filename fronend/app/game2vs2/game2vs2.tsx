'use client';
import { useRef, useState, useEffect, useCallback } from 'react';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 15;
const PADDLE_SPEED = 5;
const BALL_SPEED = 6;
const COUNTDOWN_TIME = 5; // Countdown time in seconds

export default function Game2vs2() {
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

  const connectToServer = () => {
    if (connectionStatus === 'connected') {
      // If already connected, disconnect
      if (wsRef.current) {
        wsRef.current.close();
      }
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL_2V2 || 'ws://localhost:3001/2v2';
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
        player_n_ref.current = data.playerIndex + 1;
        setopenTheGame(true);
        console.log(`Match found! Room ID: ${data}`);

        if (data.players) {
          const myPlayer = data.players.find((p: any) => p.playerIndex === 0 || p.playerIndex === 1);
          const opponent = data.players.find((p: any) => p.playerIndex === 2 || p.playerIndex === 3);
          
          if (player_n_ref.current !== null && (player_n_ref.current === 1 || player_n_ref.current === 2)) setP_me_PaddleY(myPlayer.paddleY);
          if (player_n_ref.current !== null && (player_n_ref.current === 4 || player_n_ref.current === 3)) setP_2_PaddleY(opponent.paddleY);
          console.log('Game state updated:', { myPlayer, opponent });
        }
        break;
      case 'opponentDisconnected':
        setGameOver(data.message);
        setIsLoading(false);
        setGameRunning(false);
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
        setIsLoading(true);
        break;
      case 'playerId':
        playerIdRef.current = data.playerId;
        setPlayerId(data.playerId);
        console.log(`🎮 Your player ID in B: ${playerId}`);
        console.log(`🎮 Your player ID in S: ${data.playerId}`);
        break;
      case 'gameState':
        const myId = playerIdRef.current;
        if (!myId) return;
        let xxIsFirst = false;
        if (data.gameState?.players) {
          const myPlayer = data.gameState.players.find((p: any) => p.id === myId);
          if (myPlayer && myPlayer.playerIndex === 0 || myPlayer.playerIndex === 1) {
            xxIsFirst = true;
          }
          
          const opponent = xxIsFirst ? data.gameState.players.find((p: any) => p.playerIndex === 2 || p.playerIndex === 3) : data.gameState.players.find((p: any) => p.playerIndex === 1 || p.playerIndex === 0);

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
        console.log('Game Over:', data.message);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }, [playerId]);

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

  useEffect(() => {
    const handleMovement = () => {
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

  useEffect(() => {
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
    if (wsRef.current) {
      wsRef.current.onopen = () => {
        wsRef.current?.send(JSON.stringify({
          type: 'gameType', 
          game: '2vs2'
        }));
      };
    }
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
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      
      {/* Connection Status Header (only when game is not open) */}
      {!openTheGame && (
        <div className="text-center space-y-4">
          <div className="border-2 border-cyan-400 bg-gray-900 px-8 py-3 mb-4" style={{
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)'
          }}>
            <h1 className="text-3xl font-bold text-cyan-400 tracking-widest" style={{
              textShadow: '0 0 10px rgba(34, 211, 238, 0.8)'
            }}>
              PING PONG 2VS2
            </h1>
          </div>
          
          <div className="text-cyan-400 text-xl" style={{
            textShadow: '0 0 8px rgba(34, 211, 238, 0.6)'
          }}>
            Status: {connectionStatus}
          </div>
          
          {messagee && <h2 className="text-gray-300 text-lg">{messagee}</h2>}
          {playerId && <h2 className="text-gray-400">Player ID: {playerId}</h2>}
          {roomId && <h2 className="text-gray-400">Room ID: {roomId}</h2>}
          {player_N && <h2 className="text-gray-400">Player #{player_N}</h2>}
          {player_N && <h2 className="text-yellow-400">Your move: {player_N % 2 === 0 ? "UP" : "DOWN"}</h2>}
          
          {isLoading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" style={{
                boxShadow: '0 0 15px rgba(34, 211, 238, 0.5)'
              }}></div>
            </div>
          )}
          
          {connectionStatus === 'connecting' && (
            <button 
              onClick={disconnectFromServer}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded shadow-lg"
            >
              Disconnect
            </button>
          )}
        </div>
      )}

      {/* Game Area */}
      {openTheGame && (
        <div>
          {/* Header */}
          <div className="mb-8">
            <div className="border-2 border-cyan-400 bg-gray-900 px-8 py-3 mb-4" style={{
              boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)'
            }}>
              <h1 className="text-3xl text-center font-bold text-cyan-400 tracking-widest" style={{
                textShadow: '0 0 10px rgba(34, 211, 238, 0.8)'
              }}>PING PONG 2VS2</h1>
            </div>
            <div className="text-center space-y-2">
              <p className="text-gray-400">
                Room: {roomId} • Status: {connectionStatus} • Player #{player_N}
              </p>
              <p className="text-yellow-400 text-sm">
                Your Control: {player_N % 2 === 0 ? "W/↑ (UP)" : "S/↓ (DOWN)"}
              </p>
            </div>
          </div>

          {/* Game Container */}
          <div className="border-1 border-gray-600 bg-gray-900 p-6 rounded-lg" style={{
            boxShadow: '0 0 30px rgba(34, 211, 238, 0.4)'
          }}>
            {/* Score and Controls */}
            <div className="flex items-center justify-between mb-4">
              {/* Team 1 Score */}
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-400" style={{
                  textShadow: '0 0 15px rgba(34, 211, 238, 0.8)'
                }}>{myScore}</div>
                <div className="text-gray-400 text-sm">Team 1</div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-3">
                <button
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded shadow-lg"
                  onClick={disconnectFromServer}
                >
                  Disconnect
                </button>
              </div>

              {/* Team 2 Score */}
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-400" style={{
                  textShadow: '0 0 15px rgba(196, 181, 253, 0.8)'
                }}>{opponentScore}</div>
                <div className="text-gray-400 text-sm">Team 2</div>
              </div>
            </div>

            {/* Game Area */}
            <div
              className="relative bg-gray-900 border-none rounded-lg"
              style={{ 
                width: CANVAS_WIDTH, 
                height: CANVAS_HEIGHT,
                boxShadow: '0 0 25px rgba(34, 211, 238, 0.6), inset 0 0 25px rgba(34, 211, 238, 0.1)'
              }}
              tabIndex={0}
              onFocus={(e) => e.currentTarget.style.outline = 'none'}
            >
              {/* Left Paddle (Team 1) */}
              <div
                className="absolute bg-cyan-500 rounded-r-sm"
                style={{
                  left: '0px',
                  top: `${P_me_paddleY}px`,
                  width: `${PADDLE_WIDTH}px`,
                  height: `${PADDLE_HEIGHT}px`,
                  boxShadow: '0 0 20px rgba(34, 211, 238, 0.8)'
                }}
              />

              {/* Right Paddle (Team 2) */}
              <div
                className="absolute bg-cyan-500 rounded-l-sm"
                style={{
                  left: `${CANVAS_WIDTH - PADDLE_WIDTH}px`,
                  top: `${P_2_paddleY}px`,
                  width: `${PADDLE_WIDTH}px`,
                  height: `${PADDLE_HEIGHT}px`,
                  boxShadow: '0 0 20px rgba(34, 211, 238, 0.8)'
                }}
              />

              {/* Ball */}
              {!gameOver && (
                <div
                  className="absolute bg-green-400 rounded-full"
                  style={{
                    left: `${ballX - BALL_SIZE / 2}px`,
                    top: `${ballY - BALL_SIZE / 2}px`,
                    width: `${BALL_SIZE}px`,
                    height: `${BALL_SIZE}px`,
                    boxShadow: '0 0 25px rgba(34, 197, 94, 0.9)'
                  }}
                />
              )}

              {/* Center Line */}
              <div 
                className="absolute h-full left-1/2 transform -translate-x-1/2 border-l-2 border-cyan-400 border-dashed opacity-50"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.6))'
                }}
              ></div>

              {/* Game Over */}
              {gameOver && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-900 bg-opacity-90">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-cyan-400 mb-4" style={{
                      textShadow: '0 0 25px rgba(34, 211, 238, 1)'
                    }}>{gameOver}</h1>
                    <p className="text-gray-400">Game Over</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}