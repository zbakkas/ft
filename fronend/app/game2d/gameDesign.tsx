import { useEffect, useState } from "react";

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
}: GameDesignProps) {

  const [countdown, setCountdown] = useState<number | null>(null);

  // Fixed countdown logic
  useEffect(() => {
    // Reset countdown when game state changes
    if (!openTheGame || gameRunning || gameOver) {
      setCountdown(null);
      return;
    }

    // Start countdown only when game is open but not running
    if (openTheGame && !gameRunning && !gameOver) {
      setCountdown(COUNTDOWN_TIME);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            return null; // This should hide the countdown
          }
          return prev - 1;
        });
      }, 1000);

      // Cleanup function
      return () => {
        clearInterval(timer);
      };
    }
  }, [openTheGame, gameRunning, gameOver, COUNTDOWN_TIME]);

  // Alternative countdown logic that's more explicit
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

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [openTheGame, gameRunning, gameOver, COUNTDOWN_TIME]);

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
              PING PONG ONLINE
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
          
          {isLoading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" style={{
                boxShadow: '0 0 15px rgba(34, 211, 238, 0.5)'
              }}></div>
            </div>
          )}
          
          {connectionStatus === 'connected' && (
            <button 
              onClick={disconnectFromServer}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded shadow-lg"
            >
              Disconnect
            </button>
          )}
        </div>
      )}

      {/* Game Area (matching gameOffline.tsx exactly) */}
      {openTheGame && (
        <div>
          {/* Header */}
          <div className="mb-8">
            <div className="border-2 border-cyan-400 bg-gray-900 px-8 py-3 mb-4" style={{
              boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)'
            }}>
              <h1 className="text-3xl text-center font-bold text-cyan-400 tracking-widest" style={{
                textShadow: '0 0 10px rgba(34, 211, 238, 0.8)'
              }}>PING PONG</h1>
            </div>
            <p className="text-gray-400 text-center">
              Multiplayer Match • Room: {roomId} • Status: {connectionStatus}
            </p>
          </div>

          {/* Game Container */}
          <div className="border-1 border-gray-600 bg-gray-900 p-6 rounded-lg" style={{
            boxShadow: '0 0 30px rgba(34, 211, 238, 0.4)'
          }}>
            {/* Score and Controls */}
            <div className="flex items-center justify-between mb-4">
              {/* Player 1 Score (You) */}
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-400" style={{
                  textShadow: '0 0 15px rgba(34, 211, 238, 0.8)'
                }}>{myScore}</div>
                <div className="text-gray-400 text-sm">You</div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-3">
                <button
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded shadow-lg"
                  onClick={disconnectFromServer}
                >
                  Disconnect
                </button>
                {/* Debug info */}
                <div className="text-xs text-gray-500">
                  Game: {gameRunning ? 'Running' : 'Not Running'} | Countdown: {countdown}
                </div>
              </div>

              {/* Player 2 Score (Opponent) */}
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-400" style={{
                  textShadow: '0 0 15px rgba(196, 181, 253, 0.8)'
                }}>{opponentScore}</div>
                <div className="text-gray-400 text-sm">Opponent</div>
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
              {/* Left Paddle (Your paddle) */}
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

              {/* Right Paddle (Opponent paddle) */}
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
                    left: `${ballX}px`,
                    top: `${ballY}px`,
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

              {/* Countdown - Fixed logic */}
              {countdown !== null && countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80">
                  <div className="text-8xl font-bold text-cyan-400" style={{
                    textShadow: '0 0 30px rgba(34, 211, 238, 1)'
                  }}>
                    {countdown}
                  </div>
                </div>
              )}

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