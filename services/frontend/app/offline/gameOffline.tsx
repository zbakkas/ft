'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLang } from "@/app/context/LangContext";

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

export default function GameOffline() {
    const { lang } = useLang()!;
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

    const keysRef = useRef<Set<string>>(new Set());
    const gameLoopRef = useRef<number | undefined>(undefined);

    const [ballVelocityX, setBallVelocityX] = useState<number>(BALL_SPEED);
    const [ballVelocityY, setBallVelocityY] = useState<number>(BALL_SPEED);
    const [ballMoving, setBallMoving] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number | null>(null);

    // --- LOGIC ---
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
            setGameOver("PLAYER 2 WINS!");
        }
        if (leftPlayerScore >= SCORE_W) {
            setBallMoving(false);
            setGameOver("PLAYER 1 WINS!");
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

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black flex flex-col items-center justify-center p-4 font-mono relative">
            
            {/* --- BACK BUTTON --- */}
            <div className="absolute top-6 left-6 z-50">
                <Link 
                    href="/" 
                    className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all duration-300 group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold text-sm tracking-wide uppercase">Home</span>
                </Link>
            </div>

            {/* --- HEADER --- */}
            <div className="mb-6 relative group text-center">
                 <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
                 <h1 className="relative text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter">
                     NEON PONG
                 </h1>
                 <p className="relative text-gray-500 text-xs mt-2 font-bold tracking-widest uppercase">
                     Local 1 vs 1
                 </p>
            </div>

            {/* --- GAME CONTAINER --- */}
            <div className="w-full max-w-5xl animate-in fade-in duration-700">
                
                {/* --- CONTROLS & SCORE --- */}
                <div className="bg-gray-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 mb-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                    
                    {/* Player 1 Score */}
                    <div className="text-center md:text-left">
                        <div className="text-cyan-400 font-bold text-sm tracking-wider mb-1">PLAYER 1</div>
                        <div className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                            {leftPlayerScore}
                        </div>
                    </div>

                    {/* Middle Controls */}
                    <div className="flex flex-col items-center gap-3">
                        {!gamerunning ? (
                            <button
                                onClick={startgame}
                                className="px-8 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold uppercase tracking-widest rounded shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all transform hover:scale-105"
                            >
                                {lang === "eng" ? "Start Match" : "Commencer le match"}
                            </button>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={togglePause}
                                    className="px-6 py-2 border border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400 font-bold uppercase text-xs tracking-widest rounded transition-all"
                                >
                                    {isPaused ? (lang === "eng" ? 'Resume' : 'Reprendre') : (lang === "eng" ? 'Pause' : 'Pause')}
                                </button>
                                <button
                                    onClick={resetGame}
                                    className="px-6 py-2 border border-red-500/50 hover:bg-red-500/10 text-red-400 font-bold uppercase text-xs tracking-widest rounded transition-all"
                                >
                                    {lang === "eng" ? 'Reset' : 'Réinitialiser'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Player 2 Score */}
                    <div className="text-center md:text-right">
                        <div className="text-purple-400 font-bold text-sm tracking-wider mb-1">{lang === "eng" ? "PLAYER 2" : "JOUEUR 2"}</div>
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

                        {/* Left Paddle (Player 1 - Cyan) */}
                        <div
                            className="absolute bg-cyan-400 rounded-r-md shadow-[0_0_15px_rgba(34,211,238,0.6)]"
                            style={{
                                left: 0,
                                top: leftPlayerPaddleY,
                                width: PADDLE_WIDTH,
                                height: PADDLE_HEIGHT,
                            }}
                        />

                        {/* Right Paddle (Player 2 - Purple) */}
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
                                <p className="text-cyan-300 mb-8">{lang === "eng" ? "Press Reset to play again" : "Appuyez sur Réinitialiser pour rejouer"}</p>
                                <button 
                                    onClick={resetGame}
                                    className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest hover:bg-cyan-400 hover:scale-105 transition-all duration-200"
                                >
                                    {lang === "eng" ? "Play Again" : "Rejouer"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Instructions Footer */}
                <div className="mt-4 text-center text-gray-500 text-xs font-mono">
                    {lang === "eng" ? "P1" : "J1"}: <span className="text-cyan-400 font-bold">[W]</span> <span className="text-cyan-400 font-bold">[S]</span> • 
                    {lang === "eng" ? "P2" : "J2"}: <span className="text-purple-400 font-bold">[↑]</span> <span className="text-purple-400 font-bold">[↓]</span> • 
                    {lang === "eng" ? "SPACE to pause" : "SPACE pour pause"}
                </div>

            </div>
        </div>
    );
}