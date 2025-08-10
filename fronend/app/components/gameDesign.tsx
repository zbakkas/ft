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

  // Countdown
  const [countdown, setCountdown] = useState<number | null>(null);


  // Add this useEffect to handle the countdown timer
useEffect(() => {
  if (openTheGame && !gameRunning) {
    // Start countdown when game opens but hasn't started yet
    setCountdown(COUNTDOWN_TIME);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null; // Timer finished
        }
        return prev - 1;
      });
    }, 1000); // 1 second intervals

    // Cleanup function
    return () => clearInterval(timer);
  }
}, [openTheGame]);

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
      {openTheGame && (
        <div
          className=" relative bg-black border border-white rotate-0 items-center justify-center  m-auto"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          
        >
          {/* Left Paddle (Your paddle) */}
          <div
            className="absolute bg-green-400"
            style={{
              left: '0px',
              top: `${P_me_paddleY}px`,
              width: `${PADDLE_WIDTH}px`,
              height: `${PADDLE_HEIGHT}px`,
            }}
          />
          {/* Right Paddle (Opponent paddle) */}
          <div
            className="absolute bg-white"
            style={{
              left: `${CANVAS_WIDTH - PADDLE_WIDTH - 0}px`,
              top: `${P_2_paddleY}px`,
              width: `${PADDLE_WIDTH}px`,
              height: `${PADDLE_HEIGHT}px`,
            }}
          />

           {/* Ball */}
           {!gameOver &&
          <div
            className="absolute bg-red-500 rounded-full z-1"
            style={{
              left: `${(ballX - BALL_SIZE / 2)}px`,
              top: `${(ballY - BALL_SIZE / 2)}px`,
              width: `${BALL_SIZE}px`,
              height: `${BALL_SIZE}px`,
            }}
          />
          }

         {/* Scores */}
        <div className="absolute  w-full   flex justify-between pt-5 px-50  items-center text-xl font-bold text-white">
          <div> {myScore}</div>
          <div> {opponentScore}</div>
        </div>

         {/* Add this to your JSX, inside the game area div where you want to display the countdown */}
{countdown !== null && (
  <div className="absolute inset-0 flex items-center justify-center ">
    <div className="text-9xl font-bold text-white/90 px-8 py-4 rounded-lg z-4">
      {countdown}
    </div>
  </div>
)}
        {gameOver && (
          <h1 className='absolute font-bold text-6xl text-center z-4 inset-0 flex items-center justify-center'>{gameOver}</h1>
        )}

   {/* Center Line */}
    <div
      className="absolute h-full left-1/2 transform -translate-x-1/2 border-l-2 border-gray-400 border-dashed"
    />
        
        </div>
      )}


    </div>
  );
}