"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface Player {
  id: string;
  paddleY: number;
  score: number;
  playerIndex: number;
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

const AutoMatchmakingPong: React.FC = () => {
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

  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'waiting' | 'matched' | 'playing' | 'error'>('disconnected');
  const [playerId, setPlayerId] = useState<string>('');
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);
  const [gameId, setGameId] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [waitingCount, setWaitingCount] = useState<number>(0);

  // Connect to WebSocket server and start matchmaking
  const connectAndFindMatch = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    setConnectionState('connecting');
    setStatusMessage('Connecting to matchmaking server...');

    // Get WebSocket URL from environment variable or use localhost as fallback
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionState('waiting');
      setStatusMessage('Looking for an opponent...');
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
      setPlayerId('');
      setPlayerIndex(null);
      setGameId('');
    };

    ws.onerror = () => {
      setConnectionState('error');
      setStatusMessage('Connection error');
    };
  }, []);

  const handleServerMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'waitingForOpponent':
        setConnectionState('waiting');
        setStatusMessage(data.message);
        setWaitingCount(data.waitingPlayers || 0);
        break;

      case 'matchFound':
        setPlayerId(data.playerId);
        setPlayerIndex(data.playerIndex);
        setGameId(data.gameId);
        setGameState(data.gameState);
        setConnectionState('matched');
        setStatusMessage(data.message + ' - Game starting soon...');
        break;

      case 'gameStarted':
        setConnectionState('playing');
        setStatusMessage('Game in progress! Use W/S or Arrow keys to move.');
        break;

      case 'gameState':
        setGameState(data.gameState);
        break;

      case 'opponentDisconnected':
        setStatusMessage(data.message);
        setConnectionState('waiting');
        setGameState(prev => ({ ...prev, gameRunning: false }));
        break;

      case 'error':
        setStatusMessage(`Error: ${data.message}`);
        setConnectionState('error');
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
  useEffect(() => 
  {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 's' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
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
  }, []);

  // Game control functions
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

  // Disconnect and return to matchmaking
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setConnectionState('disconnected');
    setPlayerId('');
    setPlayerIndex(null);
    setGameId('');
    setStatusMessage('');
  }, []);

  // Drawing function with perspective flip for player 2
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Determine if we need to flip the view (player 2 sees flipped perspective)
    const isFlipped = playerIndex === 1;

    if (isFlipped) {
      // Flip the canvas horizontally for player 2
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-CANVAS_WIDTH, 0);
    }

    // Draw center line
    ctx.strokeStyle = '#ffffff';
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Get players
    const player1 = gameState.players.find(p => p.playerIndex === 0);
    const player2 = gameState.players.find(p => p.playerIndex === 1);

    // Draw paddles
    ctx.fillStyle = '#ffffff';
    
    if (player1) {
      // Player 1 paddle (always on left in normal view, right in flipped view)
      ctx.fillStyle = player1.id === playerId ? '#00ff00' : '#ffffff';
      ctx.fillRect(0, player1.paddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    }

    if (player2) {
      // Player 2 paddle (always on right in normal view, left in flipped view)
      ctx.fillStyle = player2.id === playerId ? '#00ff00' : '#ffffff';
      ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, player2.paddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    }

    // Draw ball
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(gameState.ballX, gameState.ballY, BALL_SIZE, 0, Math.PI * 2);
    ctx.fill();

    // Restore context after flipping (if needed)
    if (isFlipped) {
      ctx.restore();
    }
    
    // Draw scores
    ctx.font = '36px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#50eb02';
    
    const myScore = playerIndex === 0 ? (player1?.score || 0) : (player2?.score || 0);
    const opponentScore = playerIndex === 0 ? (player2?.score || 0) : (player1?.score || 0);
    
    // Always draw my score on the left, opponent on the right
    ctx.fillText(myScore.toString(), CANVAS_WIDTH / 4, 50);
    ctx.fillText(opponentScore.toString(), (3 * CANVAS_WIDTH) / 4, 50);

  }, [gameState, playerId, playerIndex]);

  // Render canvas
  useEffect(() => {
    if (connectionState === 'matched' || connectionState === 'playing') {
      draw();
    }
  }, [draw, connectionState]);

  const player1 = gameState.players.find(p => p.playerIndex === 0);
  const player2 = gameState.players.find(p => p.playerIndex === 1);

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected': case 'matched': case 'playing': return 'bg-green-600';
      case 'waiting': return 'bg-yellow-600';
      case 'connecting': return 'bg-blue-600';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionState) {
      case 'connected': return 'CONNECTED';
      case 'connecting': return 'CONNECTING';
      case 'waiting': return 'SEARCHING';
      case 'matched': return 'MATCHED';
      case 'playing': return 'PLAYING';
      case 'error': return 'ERROR';
      default: return 'OFFLINE';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">AUTO MATCHMAKING PONG</h1>
        <p className="text-gray-300">
          Automatic player matching - Just click "Find Match" and get paired instantly!
        </p>
      </div>

      {/* Connection/Matchmaking Interface */}
      {connectionState === 'disconnected' && (
        <div className="bg-gray-800 p-8 rounded-lg mb-6 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Play?</h2>
          <p className="text-gray-300 mb-6">
            Click below to automatically find an opponent and start playing!
          </p>
          <button
            onClick={connectAndFindMatch}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-colors"
          >
            🎮 Find Match
          </button>
        </div>
      )}

      {/* Waiting/Matched/Playing Interface */}
      {connectionState !== 'disconnected' && (
        <>
          <div className="mb-4 text-center">
            <div className="text-white mb-2">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getConnectionStatusColor()}`}>
                {getConnectionStatusText()}
              </span>
              {gameId && (
                <span className="ml-4 text-gray-300">
                  Game: <span className="font-mono font-bold">{gameId}</span>
                </span>
              )}
            </div>
            
            {/* Status Messages */}
            {statusMessage && (
              <p className="text-gray-300 text-sm mb-2">{statusMessage}</p>
            )}
            
            {/* Waiting Queue Info */}
            {connectionState === 'waiting' && waitingCount > 0 && (
              <p className="text-yellow-400 text-sm">
                {waitingCount} player{waitingCount !== 1 ? 's' : ''} waiting for matches
              </p>
            )}
          </div>

          {/* Game Canvas */}
          {(connectionState === 'matched' || connectionState === 'playing') && (
            <>
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="border-2 border-white bg-black mb-6"
              />

              {/* Game Controls */}
              <div className="flex gap-4 mb-4">
                <button
                  onClick={pauseGame}
                  disabled={!gameState.gameRunning}
                  className="px-6 py-2 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  {gameState.gameRunning ? 'Pause' : 'Paused'}
                </button>
                <button
                  onClick={resetGame}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Reset
                </button>
              </div>

              {/* Score Display */}
              <div className="text-white text-center mb-4">
                <div className="text-2xl font-bold mb-2">
                  {/* Show scores from player's perspective */}
                  {playerIndex === 0 && `${player1?.score || 0} - ${player2?.score || 0}`}
                  {playerIndex === 1 && `${player2?.score || 0} - ${player1?.score || 0}`}
                </div>
                <div className="text-sm text-gray-400">
                  {gameState.gameRunning ? 'Game Running' : 'Game Paused'}
                </div>
                {playerIndex !== null && (
                  <div className="text-sm text-green-400 mt-1">
                    You are Player {playerIndex + 1} - You see yourself on the left!
                  </div>
                )}
              </div>

              {/* Controls Instructions */}
              <div className="text-gray-400 text-sm max-w-md text-center mb-4">
                <p className="mb-2">
                  <strong>Controls:</strong>
                </p>
                <p className="mb-1">• W or Arrow Up: Move paddle up</p>
                <p className="mb-1">• S or Arrow Down: Move paddle down</p>
                <p className="text-green-400">Your paddle is highlighted in green!</p>
              </div>
            </>
          )}

          {/* Disconnect Button */}
          <div className="flex justify-center">
            <button
              onClick={disconnect}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              {connectionState === 'waiting' ? 'Cancel Search' : 'Leave Game'}
            </button>
          </div>
        </>
      )}

      {/* Loading/Waiting Animation */}
      {(connectionState === 'connecting' || connectionState === 'waiting') && (
        <div className="bg-gray-800 p-8 rounded-lg mb-6 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-white mb-2">
            {connectionState === 'connecting' ? 'Connecting...' : 'Finding Match...'}
          </h3>
          <p className="text-gray-300 text-sm">
            {connectionState === 'connecting' 
              ? 'Connecting to matchmaking server...'
              : 'Looking for an available opponent...'
            }
          </p>
          {connectionState === 'waiting' && waitingCount > 0 && (
            <p className="text-yellow-400 text-xs mt-2">
              Queue position: {waitingCount}
            </p>
          )}
        </div>
      )}

      {/* Error State */}
      {connectionState === 'error' && (
        <div className="bg-red-800 p-6 rounded-lg mb-6 w-full max-w-md text-center">
          <h3 className="text-xl font-bold text-white mb-2">Connection Error</h3>
          <p className="text-red-200 text-sm mb-4">
            Failed to connect to the matchmaking server.
          </p>
          <button
            onClick={connectAndFindMatch}
            className="px-4 py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Game Info Footer */}
      <div className="text-center text-gray-500 text-xs mt-6 max-w-lg">
        <p className="mb-1">
          🎮 <strong>How it works:</strong> Players are automatically matched when they click "Find Match"
        </p>
        <p className="mb-1">
          📊 <strong>Matchmaking:</strong> 2 players → 1 game, 3 players → 1 game + 1 waiting, etc.
        </p>
        <p>
          🎯 <strong>Perspective:</strong> Each player always sees themselves on the left side
        </p>
      </div>
    </div>
  );
};

export default AutoMatchmakingPong;