// client/components/MultiplayerPong.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface Player {
  id: string;
  paddleY: number;
  score: number;
  position: 'left' | 'right';
}

interface GameState {
  ballX: number;
  ballY: number;
  gameRunning: boolean;
  players: Player[];
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;

const MultiplayerPongGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const lastPaddleMove = useRef<{ direction: string; time: number } | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    gameRunning: false,
    players: [],
  });

  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [playerId, setPlayerId] = useState<string>('');
  const [playerPosition, setPlayerPosition] = useState<'left' | 'right' | null>(null);
  const [gameId, setGameId] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Generate random game ID
  const generateGameId = useCallback(() => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }, []);

  // Connect to WebSocket server
  const connectToServer = useCallback((roomId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    setConnectionState('connecting');
    setStatusMessage('Connecting to server...');

    const ws = new WebSocket('ws://localhost:3001/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionState('connected');
      setStatusMessage('Connected! Joining game...');
      
      // Join game room
      ws.send(JSON.stringify({
        type: 'joinGame',
        gameId: roomId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
      } catch (error) {
        console.error('Error parsing server message:', error);
      }
    };

    ws.onclose = () => {
      setConnectionState('disconnected');
      setStatusMessage('Disconnected from server');
    };

    ws.onerror = () => {
      setConnectionState('error');
      setStatusMessage('Connection error');
    };
  }, []);

  const handleServerMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'playerJoined':
        setPlayerId(data.playerId);
        setPlayerPosition(data.position);
        setGameState(data.gameState);
        setStatusMessage(`You are the ${data.position} player. Waiting for opponent...`);
        break;

      case 'roomReady':
        setStatusMessage(data.message);
        break;

      case 'gameState':
        setGameState(data.gameState);
        break;

      case 'playerDisconnected':
        setStatusMessage(data.message);
        setGameState(prev => ({ ...prev, gameRunning: false }));
        break;

      case 'error':
        setStatusMessage(`Error: ${data.message}`);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }, []);

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
      direction
    }));

    lastPaddleMove.current = { direction, time: now };
  }, []);

  // Handle continuous key presses
  useEffect(() => {
    const handleMovement = () => {
      if (keysPressed.current.has('w') || keysPressed.current.has('ArrowUp')) {
        sendPaddleMove('up');
      }
      if (keysPressed.current.has('s') || keysPressed.current.has('ArrowDown')) {
        sendPaddleMove('down');
      }
    };

    const intervalId = setInterval(handleMovement, 16); // ~60fps

    return () => clearInterval(intervalId);
  }, [sendPaddleMove]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle movement keys for the correct player
      if (playerPosition === 'left' && (e.key === 'w' || e.key === 's')) {
        keysPressed.current.add(e.key);
      } else if (playerPosition === 'right' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        keysPressed.current.add(e.key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playerPosition]);

  // Game control functions
  const startGame = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'startGame' }));
    }
  }, []);

  const pauseGame = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'pauseGame' }));
    }
  }, []);

  const resetGame = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'resetGame' }));
    }
  }, []);

  // Drawing function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw center line
    ctx.strokeStyle = '#ffffff';
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles and scores
    ctx.fillStyle = '#ffffff';
    const leftPlayer = gameState.players.find(p => p.position === 'left');
    const rightPlayer = gameState.players.find(p => p.position === 'right');

    if (leftPlayer) {
      // Highlight current player's paddle
      ctx.fillStyle = leftPlayer.id === playerId ? '#00ff00' : '#ffffff';
      ctx.fillRect(0, leftPlayer.paddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    }

    if (rightPlayer) {
      // Highlight current player's paddle
      ctx.fillStyle = rightPlayer.id === playerId ? '#00ff00' : '#ffffff';
      ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, rightPlayer.paddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    }

    // Draw ball
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(gameState.ballX, gameState.ballY, BALL_SIZE, BALL_SIZE);

    // Draw scores
    ctx.font = '36px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    if (leftPlayer) {
      ctx.fillText(leftPlayer.score.toString(), CANVAS_WIDTH / 4, 50);
    }
    if (rightPlayer) {
      ctx.fillText(rightPlayer.score.toString(), (3 * CANVAS_WIDTH) / 4, 50);
    }
  }, [gameState, playerId]);

  // Render canvas
  useEffect(() => {
    draw();
  }, [draw]);

  // Join game with ID
  const joinGame = useCallback(() => {
    if (gameId.trim()) {
      connectToServer(gameId.trim().toUpperCase());
    }
  }, [gameId, connectToServer]);

  // Create new game
  const createNewGame = useCallback(() => {
    const newGameId = generateGameId();
    setGameId(newGameId);
    connectToServer(newGameId);
  }, [generateGameId, connectToServer]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setConnectionState('disconnected');
    setPlayerId('');
    setPlayerPosition(null);
    setStatusMessage('');
  }, []);

  const leftPlayer = gameState.players.find(p => p.position === 'left');
  const rightPlayer = gameState.players.find(p => p.position === 'right');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4 game-container">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-white mb-2 text-center">MULTIPLAYER PONG</h1>
        <p className="text-gray-300 text-center">
          Real-time multiplayer Pong game
        </p>
      </div>

      {connectionState === 'disconnected' && (
        <div className="bg-gray-800 p-6 rounded-lg mb-6 w-full max-w-md">
          <h2 className="text-xl font-bold text-white mb-4">Join or Create Game</h2>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Game ID:</label>
            <input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value.toUpperCase())}
              placeholder="Enter game ID"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              maxLength={6}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={joinGame}
              disabled={!gameId.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              Join Game
            </button>
            <button
              onClick={createNewGame}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 transition-colors"
            >
              Create New
            </button>
          </div>
        </div>
      )}

      {connectionState !== 'disconnected' && (
        <>
          <div className="mb-4 text-center">
            <div className="text-white mb-2">
              <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                connectionState === 'connected' ? 'bg-green-600' : 
                connectionState === 'connecting' ? 'bg-yellow-600' : 'bg-red-600'
              }`}>
                {connectionState.toUpperCase()}
              </span>
              {gameId && (
                <span className="ml-4 text-gray-300">
                  Game ID: <span className="font-mono font-bold">{gameId}</span>
                </span>
              )}
            </div>
            {statusMessage && (
              <p className="text-gray-300 text-sm">{statusMessage}</p>
            )}
          </div>

          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border-2 border-white bg-black mb-6"
          />

          <div className="flex gap-4 mb-4">
            <button
              onClick={startGame}
              disabled={gameState.gameRunning || gameState.players.length < 2}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              Start
            </button>
            <button
              onClick={pauseGame}
              disabled={!gameState.gameRunning}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              Pause
            </button>
            <button
              onClick={resetGame}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={disconnect}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Disconnect
            </button>
          </div>

          <div className="text-white text-center mb-4">
            <div className="text-2xl font-bold mb-2">
              {leftPlayer?.score || 0} - {rightPlayer?.score || 0}
            </div>
            <div className="text-sm text-gray-400">
              {gameState.gameRunning ? 'Game Running' : 'Game Paused'}
            </div>
            {playerPosition && (
              <div className="text-sm text-green-400 mt-1">
                You are the {playerPosition} player
              </div>
            )}
          </div>

          <div className="text-gray-400 text-sm max-w-md text-center">
            <p className="mb-2">
              <strong>Controls:</strong>
            </p>
            <p className="mb-1">• Left Player: W (up) / S (down)</p>
            <p className="mb-1">• Right Player: Arrow Up / Arrow Down</p>
            <p className="text-green-400">Your paddle is highlighted in green!</p>
          </div>
        </>
      )}
    </div>
  );
};

export default MultiplayerPongGame;