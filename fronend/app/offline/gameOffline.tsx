'use client';
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const BALL_SIZE = 20;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 9;
const BALL_SPEED = 8;
const COUNTDOWN_TIME = 3;
const SCORE_W = 10;

import { useCallback, useEffect, useRef, useState } from 'react';

export default function GameOffline() {
    const [leftPlayerPaddleY, setLeftPlayerPaddleY] = useState<number>(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    const [rightPlayerPaddleY, setRightPlayerPaddleY] = useState<number>(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    const [ballX, setBallX] = useState<number>(CANVAS_WIDTH / 2 - BALL_SIZE / 2);
    const [ballY, setBallY] = useState<number>(CANVAS_HEIGHT / 2 - BALL_SIZE / 2);
    const [leftPlayerScore, setLeftPlayerScore] = useState<number>(0);
    const [rightPlayerScore, setRightPlayerScore] = useState<number>(0);
    const [gameOver, setGameOver] = useState<string | boolean>(false);
    const [gamerunning, setGameRunning] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);

    const keysRef = useRef<Set<string>>(new Set());
    const gameLoopRef = useRef<number | undefined>(undefined);

    const [ballVelocityX, setBallVelocityX] = useState<number>(BALL_SPEED);
    const [ballVelocityY, setBallVelocityY] = useState<number>(BALL_SPEED);
    const [ballMoving, setBallMoving] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number | null>(null);

    const resetGame = () => {
        setGameRunning(true);
        setIsPaused(false);
        setBallMoving(true);
        countdowwn();
        resetBallAfterScore();
        setLeftPlayerScore(0);
        setRightPlayerScore(0);
        setLeftPlayerPaddleY(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
        setRightPlayerPaddleY(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
        setGameOver(false);
    }

    const startgame = () => {
        setGameRunning(true);
        setIsPaused(false);
        setBallMoving(true);
        countdowwn();
    }

    const togglePause = () => {
        setIsPaused(!isPaused);
    }

    const countdowwn = () => {
        setCountdown(COUNTDOWN_TIME);
        
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }

    const updateBall = useCallback(() => {
        if (!ballMoving || countdown || !gamerunning || isPaused) return;

        setBallX(prevX => {
            const newX = prevX + ballVelocityX;
            
            if (newX <= PADDLE_WIDTH && 
                ballY + BALL_SIZE >= leftPlayerPaddleY && 
                ballY <= leftPlayerPaddleY + PADDLE_HEIGHT) {
                setBallVelocityX(-ballVelocityX);
                return PADDLE_WIDTH;
            }
            
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
            
            if (newY <= 0 || newY + BALL_SIZE >= CANVAS_HEIGHT) {
                setBallVelocityY(-ballVelocityY);
                return newY <= 0 ? 0 : CANVAS_HEIGHT - BALL_SIZE;
            }
            
            return newY;
        });

        if (ballX < 0) {
            setRightPlayerScore(prev => prev + 1);
            resetBallAfterScore();
        }
            
        if (ballX > CANVAS_WIDTH) {
            setLeftPlayerScore(prev => prev + 1);
            resetBallAfterScore();
        }

        if (rightPlayerScore >= SCORE_W) {
            setBallMoving(false);
            setGameOver("Player 2 Wins!");
        }
        if (leftPlayerScore >= SCORE_W) {
            setBallMoving(false);
            setGameOver("Player 1 Wins!");
        }

    }, [ballVelocityX, ballVelocityY, ballY, leftPlayerPaddleY, rightPlayerPaddleY, ballMoving, countdown, gamerunning, isPaused]);

    const resetBallAfterScore = useCallback(() => {
        setBallMoving(false);
        setBallX(CANVAS_WIDTH / 2 - BALL_SIZE / 2);
        setBallY(CANVAS_HEIGHT / 2 - BALL_SIZE / 2);
        
        const countdownInterval = setInterval(() => {
            clearInterval(countdownInterval);
            setBallVelocityX(Math.random() > 0.5 ? BALL_SPEED : -BALL_SPEED);
            setBallVelocityY((Math.random() - 0.5) * BALL_SPEED);
            setBallMoving(true);
        }, 100);
    }, []);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        keysRef.current.add(event.key.toLowerCase());
        
        if (event.key === ' ' && gamerunning) {
            event.preventDefault();
            togglePause();
        }
    }, [gamerunning]);

    const handleKeyUp = useCallback((event: KeyboardEvent) => {
        keysRef.current.delete(event.key.toLowerCase());
    }, []);

    const updatePaddles = useCallback(() => {
        if (isPaused) return;
        
        const keys = keysRef.current;
        
        setLeftPlayerPaddleY(prev => {
            let newY = prev;
            if (keys.has('w')) {
                newY = Math.max(0, prev - PADDLE_SPEED);
            }
            if (keys.has('s')) {
                newY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, prev + PADDLE_SPEED);
            }
            return newY;
        });

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
    }, [isPaused]);

    const gameLoop = useCallback(() => {
        updatePaddles();
        updateBall();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [updatePaddles, updateBall]);

    useEffect(() => {
        const handleKeyDownWrapper = (e: KeyboardEvent) => handleKeyDown(e);
        const handleKeyUpWrapper = (e: KeyboardEvent) => handleKeyUp(e);

        window.addEventListener('keydown', handleKeyDownWrapper);
        window.addEventListener('keyup', handleKeyUpWrapper);

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
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
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
                    Player 1: W/S keys • Player 2: Arrow keys • Space to pause
                </p>
            </div>

            {/* Game Container */}
            <div className="border-1 border-gray-600 bg-gray-900 p-6 rounded-lg" style={{
                boxShadow: '0 0 30px rgba(34, 211, 238, 0.4)'
            }}>
                {/* Score and Controls */}
                <div className="flex items-center justify-between mb-4">
                    {/* Player 1 Score */}
                    <div className="text-center">
                        <div className="text-4xl font-bold text-cyan-400" style={{
                            textShadow: '0 0 15px rgba(34, 211, 238, 0.8)'
                        }}>{leftPlayerScore}</div>
                        <div className="text-gray-400 text-sm">Player 1</div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex gap-3">
                        {!gamerunning ? (
                            <button
                                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded shadow-lg"
                                style={{
                                    boxShadow: '0 0 15px rgba(34, 211, 238, 0.5)'
                                }}
                                onClick={startgame}
                            >
                                Start
                            </button>
                        ) : (
                            <>
                                <button
                                    className="px-6 py-2 bg-cyan-600 text-white font-bold rounded shadow-lg"
                                    style={{
                                        boxShadow: '0 0 15px rgba(147, 51, 234, 0.5)'
                                    }}
                                    onClick={togglePause}
                                >
                                    {isPaused ? 'Resume' : 'Pause'}
                                </button>
                                <button
                                    className="px-6 py-2 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded shadow-lg"
                                    onClick={resetGame}
                                >
                                    Reset
                                </button>
                            </>
                        )}
                    </div>

                    {/* Player 2 Score */}
                    <div className="text-center">
                        <div className="text-4xl font-bold text-cyan-400" style={{
                            textShadow: '0 0 15px rgba(196, 181, 253, 0.8)'
                        }}>{rightPlayerScore}</div>
                        <div className="text-gray-400 text-sm">Player 2</div>
                    </div>
                </div>

                {/* Game Area */}
                <div
                    className="relative bg-gray-900 border-none  rounded-lg"
                    style={{ 
                        width: CANVAS_WIDTH, 
                        height: CANVAS_HEIGHT,
                        boxShadow: '0 0 25px rgba(34, 211, 238, 0.6), inset 0 0 25px rgba(34, 211, 238, 0.1)'
                    }}
                    tabIndex={0}
                    ///remove outline on focus
                    onFocus={(e) => e.currentTarget.style.outline = 'none'}
                >
                    {/* Left Paddle */}
                    <div
                        className="absolute bg-cyan-500 rounded-r-sm"
                        style={{
                            left: '0px',
                            top: `${leftPlayerPaddleY}px`,
                            width: `${PADDLE_WIDTH}px`,
                            height: `${PADDLE_HEIGHT}px`,
                            boxShadow: '0 0 20px rgba(34, 211, 238, 0.8)'
                        }}
                    />

                    {/* Right Paddle */}
                    <div
                        className="absolute bg-cyan-500 rounded-l-sm"
                        style={{
                            left: `${CANVAS_WIDTH - PADDLE_WIDTH}px`,
                            top: `${rightPlayerPaddleY}px`,
                            width: `${PADDLE_WIDTH}px`,
                            height: `${PADDLE_HEIGHT}px`,
                            boxShadow: '0 0 20px rgba(34, 211, 238, 0.8)'
                        }}
                    />

                    {/* Ball */}
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

                    {/* Center Line */}
                    <div 
                        className="absolute h-full left-1/2 transform -translate-x-1/2 border-l-2 border-cyan-400 border-dashed opacity-50"
                        style={{
                            filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.6))'
                        }}
                    ></div>

                    {/* Countdown */}
                    {countdown !== null && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80">
                            <div className="text-8xl font-bold text-cyan-400" style={{
                                textShadow: '0 0 30px rgba(34, 211, 238, 1)'
                            }}>
                                {countdown}
                            </div>
                        </div>
                    )}

                    {/* Pause Overlay */}
                    {isPaused && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80">
                            <div className="text-4xl font-bold text-cyan-400" style={{
                                textShadow: '0 0 20px rgba(34, 211, 238, 1)'
                            }}>PAUSED</div>
                        </div>
                    )}

                    {/* Game Over */}
                    {gameOver && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-900 bg-opacity-90">
                            <div className="text-center">
                                <h1 className="text-4xl font-bold text-cyan-400 mb-4" style={{
                                    textShadow: '0 0 25px rgba(34, 211, 238, 1)'
                                }}>{gameOver}</h1>
                                <p className="text-gray-400">Press Reset to play again</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}