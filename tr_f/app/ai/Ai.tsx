'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// --- CONSTANTS ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const BALL_SIZE = 20;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 9;
const BALL_SPEED = 8;
const COUNTDOWN_TIME = 3;
const SCORE_W = 10;
const AI_REACTION_DELAY = 1000; 
const AI_PREDICTION_DEPTH = 3; 
const EASY_AI_SPEED_MULTIPLIER = 0.6; 

export default function AI() {
    // --- STATE ---
    const [leftPlayerPaddleY, setLeftPlayerPaddleY] = useState<number>(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    const [rightPlayerPaddleY, setRightPlayerPaddleY] = useState<number>(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    const [ballX, setBallX] = useState<number>(CANVAS_WIDTH / 2 - BALL_SIZE / 2);
    const [ballY, setBallY] = useState<number>(CANVAS_HEIGHT / 2 - BALL_SIZE / 2);
    const [leftPlayerScore, setLeftPlayerScore] = useState<number>(0);
    const [rightPlayerScore, setRightPlayerScore] = useState<number>(0);
    const [gameOver, setGameOver] = useState<string | boolean>(false);
    const [gamerunning, setGameRunning] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [aiDifficulty, setAIDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

    // --- REFS ---
    const keysRef = useRef<Set<string>>(new Set());
    const gameLoopRef = useRef<number | undefined>(undefined);
    const aiLoopRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const aiTargetRef = useRef<number>(CANVAS_HEIGHT / 2);
    const aiCurrentActionRef = useRef<'up' | 'down' | 'none'>('none');
    const lastAISnapshotRef = useRef<{
        ballX: number;
        ballY: number;
        ballVelX: number;
        ballVelY: number;
        timestamp: number;
    } | null>(null);

    const [ballVelocityX, setBallVelocityX] = useState<number>(BALL_SPEED);
    const [ballVelocityY, setBallVelocityY] = useState<number>(BALL_SPEED);
    const [ballMoving, setBallMoving] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number | null>(null);

    // --- AI LOGIC ---
    const predictBallPosition = useCallback((
        startX: number, 
        startY: number, 
        velX: number, 
        velY: number,
        targetX: number
    ): number => {
        let x = startX;
        let y = startY;
        let vx = velX;
        let vy = velY;
        let bounces = 0;
        const maxIterations = 1000;
        let iterations = 0;

        while (iterations < maxIterations && bounces < AI_PREDICTION_DEPTH) {
            if ((vx > 0 && x >= targetX) || (vx < 0 && x <= targetX)) {
                let errorMargin = 0;
                if (aiDifficulty === 'easy') {
                    errorMargin = (Math.random() - 0.5) * 150; 
                } else if (aiDifficulty === 'medium') {
                    errorMargin = (Math.random() - 0.5) * 60;
                } else {
                    errorMargin = (Math.random() - 0.5) * 30;
                }
                return Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, y - PADDLE_HEIGHT / 2 + errorMargin));
            }
            x += vx;
            y += vy;

            if (y <= 0) {
                y = 0;
                vy = -vy;
                bounces++;
            } else if (y + BALL_SIZE >= CANVAS_HEIGHT) {
                y = CANVAS_HEIGHT - BALL_SIZE;
                vy = -vy;
                bounces++;
            }
            if (x <= PADDLE_WIDTH || x + BALL_SIZE >= CANVAS_WIDTH - PADDLE_WIDTH) {
                vx = -vx;
                bounces++;
            }
            iterations++;
        }
        return CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    }, [aiDifficulty]);

    const updateAIDecision = useCallback(() => {
        if (!ballMoving || countdown || !gamerunning || isPaused) {
            aiCurrentActionRef.current = 'none';
            return;
        }

        lastAISnapshotRef.current = {
            ballX, ballY, ballVelX: ballVelocityX, ballVelY: ballVelocityY, timestamp: Date.now()
        };

        if (ballVelocityX > 0) {
            const predictedY = predictBallPosition(
                ballX, ballY, ballVelocityX, ballVelocityY, CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE
            );
            aiTargetRef.current = predictedY;
        } else {
            const centerBias = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
            const currentBias = ballY - PADDLE_HEIGHT / 2;
            aiTargetRef.current = centerBias * 0.7 + currentBias * 0.3;
        }

        const paddleCenter = rightPlayerPaddleY + PADDLE_HEIGHT / 2;
        const targetCenter = aiTargetRef.current + PADDLE_HEIGHT / 2;
        const deadZone = aiDifficulty === 'easy' ? 80 : aiDifficulty === 'medium' ? 40 : 20;

        if (Math.abs(paddleCenter - targetCenter) < deadZone) {
            aiCurrentActionRef.current = 'none';
        } else if (paddleCenter < targetCenter) {
            aiCurrentActionRef.current = 'down';
        } else {
            aiCurrentActionRef.current = 'up';
        }

        if (aiDifficulty === 'easy' && Math.random() < 0.6) {
            const actions: Array<'up' | 'down' | 'none'> = ['up', 'down', 'none', 'none', 'none'];
            aiCurrentActionRef.current = actions[Math.floor(Math.random() * actions.length)];
        } else if (aiDifficulty === 'medium' && Math.random() < 0.25) {
            aiCurrentActionRef.current = 'none';
        }
    }, [ballMoving, countdown, gamerunning, isPaused, ballX, ballY, ballVelocityX, ballVelocityY, rightPlayerPaddleY, predictBallPosition, aiDifficulty]);

    // --- GAME CONTROLS ---
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
        aiCurrentActionRef.current = 'none';
        lastAISnapshotRef.current = null;
    }

    const startgame = () => {
        setGameRunning(true);
        setIsPaused(false);
        setBallMoving(true);
        countdowwn();
        aiCurrentActionRef.current = 'none';
        lastAISnapshotRef.current = null;
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
            setGameOver("AI Wins!");
        }
        if (leftPlayerScore >= SCORE_W) {
            setBallMoving(false);
            setGameOver("Player Wins!");
        }
    }, [ballVelocityX, ballVelocityY, ballY, leftPlayerPaddleY, rightPlayerPaddleY, ballMoving, countdown, gamerunning, isPaused, ballX, rightPlayerScore, leftPlayerScore]);

    const resetBallAfterScore = useCallback(() => {
        setBallMoving(false);
        setBallX(CANVAS_WIDTH / 2 - BALL_SIZE / 2);
        setBallY(CANVAS_HEIGHT / 2 - BALL_SIZE / 2);
        aiCurrentActionRef.current = 'none';
        lastAISnapshotRef.current = null;
        
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
            if (keys.has('w')) newY = Math.max(0, prev - PADDLE_SPEED);
            if (keys.has('s')) newY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, prev + PADDLE_SPEED);
            return newY;
        });

        setRightPlayerPaddleY(prev => {
            let newY = prev;
            const action = aiCurrentActionRef.current;
            const speed = aiDifficulty === 'easy' ? PADDLE_SPEED * EASY_AI_SPEED_MULTIPLIER : PADDLE_SPEED;
            if (action === 'up') newY = Math.max(0, prev - speed);
            else if (action === 'down') newY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, prev + speed);
            return newY;
        });
    }, [isPaused, aiDifficulty]);

    const gameLoop = useCallback(() => {
        updatePaddles();
        updateBall();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [updatePaddles, updateBall]);

    useEffect(() => {
        if (gamerunning && !isPaused && !countdown) {
            updateAIDecision();
            aiLoopRef.current = setInterval(() => updateAIDecision(), AI_REACTION_DELAY);
            return () => { if (aiLoopRef.current) clearInterval(aiLoopRef.current); };
        } else if (aiLoopRef.current) {
            clearInterval(aiLoopRef.current);
        }
    }, [gamerunning, isPaused, countdown, updateAIDecision, ballX, ballY, ballVelocityX, ballVelocityY, rightPlayerPaddleY]);

    useEffect(() => {
        const handleKeyDownWrapper = (e: KeyboardEvent) => handleKeyDown(e);
        const handleKeyUpWrapper = (e: KeyboardEvent) => handleKeyUp(e);
        window.addEventListener('keydown', handleKeyDownWrapper);
        window.addEventListener('keyup', handleKeyUpWrapper);
        gameLoopRef.current = requestAnimationFrame(gameLoop);

        return () => {
            window.removeEventListener('keydown', handleKeyDownWrapper);
            window.removeEventListener('keyup', handleKeyUpWrapper);
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
            if (aiLoopRef.current) clearInterval(aiLoopRef.current);
        };
    }, [handleKeyDown, handleKeyUp, gameLoop]);

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black flex flex-col items-center justify-center p-4 font-mono">
            
            {/* --- HEADER --- */}
            <div className="mb-6 relative group text-center">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
                <h1 className="relative text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter">
                    NEON PONG AI
                </h1>
                <p className="relative text-gray-500 text-xs mt-2 font-bold tracking-widest uppercase">
                    Player vs Computer
                </p>
            </div>

            {/* --- GAME CONTAINER --- */}
            <div className="w-full max-w-5xl animate-in fade-in duration-700">
                
                {/* --- CONTROLS & SCORE --- */}
                <div className="bg-gray-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 mb-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                    
                    {/* Player Score */}
                    <div className="text-center md:text-left">
                        <div className="text-cyan-400 font-bold text-sm tracking-wider mb-1">YOU</div>
                        <div className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                            {leftPlayerScore}
                        </div>
                    </div>

                    {/* Middle Controls */}
                    <div className="flex flex-col items-center gap-3">
                        {!gamerunning ? (
                            <div className="flex flex-col items-center gap-3">
                                <button
                                    onClick={startgame}
                                    className="px-8 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold uppercase tracking-widest rounded shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all transform hover:scale-105"
                                >
                                    Start Game
                                </button>
                                
                                {/* Difficulty Tabs */}
                                <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
                                    {(['easy', 'medium', 'hard'] as const).map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setAIDifficulty(level)}
                                            className={`px-4 py-1 text-xs font-bold uppercase rounded transition-all ${
                                                aiDifficulty === level 
                                                ? level === 'easy' ? 'bg-green-500 text-black shadow-lg' 
                                                : level === 'medium' ? 'bg-yellow-500 text-black shadow-lg'
                                                : 'bg-red-500 text-black shadow-lg'
                                                : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={togglePause}
                                    className="px-6 py-2 border border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400 font-bold uppercase text-xs tracking-widest rounded transition-all"
                                >
                                    {isPaused ? 'Resume' : 'Pause'}
                                </button>
                                <button
                                    onClick={resetGame}
                                    className="px-6 py-2 border border-red-500/50 hover:bg-red-500/10 text-red-400 font-bold uppercase text-xs tracking-widest rounded transition-all"
                                >
                                    Reset
                                </button>
                            </div>
                        )}
                    </div>

                    {/* AI Score */}
                    <div className="text-center md:text-right">
                        <div className="text-purple-400 font-bold text-sm tracking-wider mb-1">AI BOT</div>
                        <div className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]">
                            {rightPlayerScore}
                        </div>
                    </div>
                </div>

                {/* --- CANVAS AREA --- */}
                <div className="relative p-1 rounded-xl bg-gradient-to-b from-gray-700 to-gray-900 shadow-2xl mx-auto" style={{ width: CANVAS_WIDTH + 8 }}>
                    <div 
                        className="relative bg-gray-900 rounded-lg overflow-hidden cursor-none outline-none"
                        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
                        tabIndex={0}
                        onFocus={(e) => e.currentTarget.style.outline = 'none'}
                    >
                        {/* Background Grid */}
                        <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}></div>

                        {/* Center Line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-700/50 -translate-x-1/2 border-r border-dashed border-gray-600"></div>

                        {/* Left Paddle (Player) */}
                        <div
                            className="absolute bg-cyan-400 rounded-r-md shadow-[0_0_15px_rgba(34,211,238,0.6)]"
                            style={{
                                left: 0,
                                top: leftPlayerPaddleY,
                                width: PADDLE_WIDTH,
                                height: PADDLE_HEIGHT,
                            }}
                        />

                        {/* Right Paddle (AI) */}
                        <div
                            className="absolute bg-purple-500 rounded-l-md shadow-[0_0_15px_rgba(168,85,247,0.6)]"
                            style={{
                                left: CANVAS_WIDTH - PADDLE_WIDTH,
                                top: rightPlayerPaddleY,
                                width: PADDLE_WIDTH,
                                height: PADDLE_HEIGHT,
                            }}
                        />

                        {/* Ball */}
                        {gamerunning && !gameOver && (
                            <div
                                className="absolute rounded-full bg-white z-10"
                                style={{
                                    left: ballX,
                                    top: ballY,
                                    width: BALL_SIZE,
                                    height: BALL_SIZE,
                                    boxShadow: '0 0 15px 2px rgba(255, 255, 255, 0.8), 0 0 30px 5px rgba(34, 211, 238, 0.4)' 
                                }}
                            />
                        )}

                        {/* Countdown */}
                        {countdown !== null && countdown > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 backdrop-blur-sm">
                                <span className="text-9xl font-black text-white animate-ping">{countdown}</span>
                            </div>
                        )}

                        {/* Paused Overlay */}
                        {isPaused && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 backdrop-blur-sm">
                                <span className="text-4xl font-bold text-white tracking-[1em]">PAUSED</span>
                            </div>
                        )}

                        {/* Game Over */}
                        {gameOver && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30 backdrop-blur-md p-8 text-center">
                                <h2 className="text-5xl font-black text-white mb-2 uppercase tracking-tighter">
                                    {gameOver}
                                </h2>
                                <p className="text-cyan-300 mb-8">Press Reset to play again</p>
                                <button 
                                    onClick={resetGame}
                                    className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest hover:bg-cyan-400 hover:scale-105 transition-all duration-200"
                                >
                                    Play Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Instructions Footer */}
                <div className="mt-4 text-center text-gray-500 text-xs font-mono">
                    Use <span className="text-cyan-400 font-bold">[W]</span> and <span className="text-cyan-400 font-bold">[S]</span> to move • SPACE to pause
                </div>
            </div>
        </div>
    );
}