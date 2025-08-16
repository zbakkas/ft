
'use client';
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const BALL_SIZE = 20;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 5;
const BALL_SPEED = 6;
const COUNTDOWN_TIME = 3; // Countdown time in seconds
const SCORE_W =10;


import { useCallback, useEffect, useRef, useState } from 'react';

export default function GameOffline() {
    const [leftPlayerPaddleY,setLeftPlayerPaddleY] = useState<number>(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    const [rightPlayerPaddleY,setRightPlayerPaddleY] = useState<number>(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    const [ballX, setBallX] = useState<number>(CANVAS_WIDTH / 2 - BALL_SIZE / 2);
    const [ballY, setBallY] = useState<number>(CANVAS_HEIGHT / 2 - BALL_SIZE / 2);
    const [leftPlayerScore, setLeftPlayerScore] = useState<number>(0);
    const [rightPlayerScore, setRightPlayerScore] = useState<number>(0);
    const [gameOver, setGameOver] = useState<string | boolean>(false);
    const [gamerunning,setGameRunning] =useState<boolean>(false);

    const keysRef = useRef<Set<string>>(new Set());
    const gameLoopRef = useRef<number | undefined>(undefined);


    const [ballVelocityX, setBallVelocityX] = useState<number>(BALL_SPEED);
    const [ballVelocityY, setBallVelocityY] = useState<number>(BALL_SPEED);
    const [ballMoving, setBallMoving] = useState<boolean>(false); // Control if ball should move
    const [countdown, setCountdown] = useState<number | null>(null); // Countdown display

////////////////////////////////////////////////////////////////
    const resetGame = ()=> 
    {
        setGameRunning(true);
        setBallMoving(true);
        countdowwn();
        resetBallAfterScore();
        setLeftPlayerScore(0);
        setRightPlayerScore(0);
        setLeftPlayerPaddleY(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2)
        setRightPlayerPaddleY(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2)
        
    }

    const startgame=()=>
    {
        setGameRunning(true);
        setBallMoving(true);
        countdowwn();
    }


////////////////////////////////////////////////////////////////
// Add this useEffect to handle the countdown timer
  const countdowwn= () => {
  
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

////////////////////////////////////////////////////////////////

// Update ball position and handle collisions
    const updateBall = useCallback(() => 
    {
         if (!ballMoving || countdown || !gamerunning) return; // Don't move ball if it's paused


        setBallX(prevX => {
            const newX = prevX + ballVelocityX;
            
            // Check collision with left paddle
            if (newX <= PADDLE_WIDTH && 
                ballY + BALL_SIZE >= leftPlayerPaddleY && 
                ballY <= leftPlayerPaddleY + PADDLE_HEIGHT) {
                setBallVelocityX(-ballVelocityX);
                return PADDLE_WIDTH;
            }
            
            // Check collision with right paddle
            if (newX + BALL_SIZE >= CANVAS_WIDTH - PADDLE_WIDTH && 
                ballY + BALL_SIZE >= rightPlayerPaddleY && 
                ballY <= rightPlayerPaddleY + PADDLE_HEIGHT) {
                setBallVelocityX(-ballVelocityX);
                return CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE;
            }
            return newX;
        });

        setBallY(prevY => {
            const newY = prevY + ballVelocityY;
            
            // Bounce off top and bottom walls
            if (newY <= 0 || newY + BALL_SIZE >= CANVAS_HEIGHT) {
                // setBallVelocityY((Math.random() > 0.5 ? 1 : -1) * BALL_SPEED);
                setBallVelocityY(-ballVelocityY);
                return newY <= 0 ? 0 : CANVAS_HEIGHT - BALL_SIZE;
            }
            
            return newY;
        });

                    // Ball goes off left edge - right player scores
        if (ballX < 0) {

            setRightPlayerScore(prev => prev + 1);
            resetBallAfterScore();
                
        }
            
            // Ball goes off right edge - left player scores
        if (ballX  > CANVAS_WIDTH) {
            setLeftPlayerScore(prev => prev + 1);
            resetBallAfterScore();
                
        }

        if(rightPlayerScore >= SCORE_W)
        {
            setBallMoving(false);
            setGameOver("right player wiinn")
        }
        if(leftPlayerScore >= SCORE_W)
        {
            setBallMoving(false);
            setGameOver("left player wiiinn");
        }

            

    }, [ballVelocityX, ballVelocityY, ballY, leftPlayerPaddleY, rightPlayerPaddleY,ballMoving,countdown,gamerunning]);


     // Reset ball after scoring with countdown
    const resetBallAfterScore = useCallback(() => {
        setBallMoving(false); // Stop ball movement
        setBallX(CANVAS_WIDTH / 2 - BALL_SIZE / 2);
        setBallY(CANVAS_HEIGHT / 2 - BALL_SIZE / 2);
        
        // Start countdown
        // setCountdown(2);
        
        const countdownInterval = setInterval(() => {
            // setCountdown(prev => {
                // if (prev === null || prev <= 1) {
                    clearInterval(countdownInterval);
                    // Resume ball movement with random direction
                    setBallVelocityX(Math.random() > 0.5 ? BALL_SPEED : -BALL_SPEED);
                    setBallVelocityY((Math.random() - 0.5) * BALL_SPEED);
                    setBallMoving(true);
                    // setCountdown(null);
                    // return null;
                // }
                // return prev - 1;
            // });
        }, 100);
    }, []);


///////////////////////////////////////////////////////////////
      // Handle keydown events
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        keysRef.current.add(event.key.toLowerCase());
        // event.preventDefault();
    }, []);

    // Handle keyup events
    const handleKeyUp = useCallback((event: KeyboardEvent) => {
        keysRef.current.delete(event.key.toLowerCase());
        // event.preventDefault();
    }, []);

    // Update paddle positions based on pressed keys
    const updatePaddles = useCallback(() => 
    {
        const keys = keysRef.current;
        
        // Left paddle controls (W/S keys)
        setLeftPlayerPaddleY(prev =>
        {
            let newY = prev;
            if (keys.has('w') || keys.has('W')) {
                newY = Math.max(0, prev - PADDLE_SPEED);
            }
            if (keys.has('s') || keys.has('S')) {
                newY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, prev + PADDLE_SPEED);
            }
            return newY;
        });

        // Right paddle controls (Arrow Up/Down keys)
        setRightPlayerPaddleY(prev => {
            let newY = prev;
            if (keys.has('arrowup')) {
                newY = Math.max(0, prev - PADDLE_SPEED);
            }
            if (keys.has('arrowdown')) {
                newY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, prev + PADDLE_SPEED);
            }
            return newY;
        });
    }, []);

    // Game loop
    const gameLoop = useCallback(() => {
        updatePaddles();
        updateBall();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        
    }, [updatePaddles, updateBall]);

    // Set up event listeners and game loop
    useEffect(() => {
        const handleKeyDownWrapper = (e: KeyboardEvent) => handleKeyDown(e);
        const handleKeyUpWrapper = (e: KeyboardEvent) => handleKeyUp(e);

        window.addEventListener('keydown', handleKeyDownWrapper);
        window.addEventListener('keyup', handleKeyUpWrapper);

        // Start game loop
        gameLoopRef.current = requestAnimationFrame(gameLoop);

        return () => {
            window.removeEventListener('keydown', handleKeyDownWrapper);
            window.removeEventListener('keyup', handleKeyUpWrapper);
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, [handleKeyDown, handleKeyUp, gameLoop]);

    
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">


        <div className='w-full flex items-center justify-center gap-3 '>
            {!gamerunning &&<button
            className='bg-green-500'
            onClick={startgame}>
                start
            </button>
            }
            {gamerunning&&
                <button
            className='bg-blue-600'
            onClick={resetGame}>
                resetGame
            </button>
            }

        </div>
           {/* Game Area with Paddle */}
      {true && (
        <div
          className=" relative bg-black border border-white rotate-0 items-center justify-center  m-auto"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT  }}
          tabIndex={0}
        >
          {/* Left Paddle (Your paddle) */}
          <div
            className="absolute bg-green-400"
            style={{
              left: '0px',
              top: `${leftPlayerPaddleY}px`,
              width: `${PADDLE_WIDTH}px`,
              height: `${PADDLE_HEIGHT}px`,
            }}
          />
          {/* Right Paddle (Opponent paddle) */}
          <div
            className="absolute bg-white"
            style={{
              left: `${CANVAS_WIDTH - PADDLE_WIDTH - 0}px`,
              top: `${rightPlayerPaddleY}px`,
              width: `${PADDLE_WIDTH}px`,
              height: `${PADDLE_HEIGHT}px`,
            }}
          />

           {/* Ball */}
        
          <div
            className="absolute bg-red-500 rounded-full z-1"
            style={{
              left: `${(ballX  )}px`,
              top: `${(ballY  )}px`,
              width: `${BALL_SIZE}px`,
              height: `${BALL_SIZE}px`,
            }}
          />
     
         {/* Scores */}
        <div className="absolute  w-full   flex justify-between pt-5 px-50  items-center text-xl font-bold text-white">
          <div> {leftPlayerScore}</div>
          <div> {rightPlayerScore}</div>
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

        <div> {ballX} - {ballX}</div>

         {/* Controls Instructions */}
            <div className="text-white bg-gray-800 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Controls:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <strong>Left Paddle (Green):</strong>
                        <br />W - Move Up
                        <br />S - Move Down
                    </div>
                    <div>
                        <strong>Right Paddle (White):</strong>
                        <br />↑ Arrow - Move Up
                        <br />↓ Arrow - Move Down
                    </div>
                </div>
            </div>
    </div>
  );
}