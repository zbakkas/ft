"use client";
import * as BABYLON from 'babylonjs';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import 'babylonjs-loaders';
import { GamepadIcon, Trophy, User, Users, Wifi, WifiOff, ArrowLeft } from 'lucide-react';
import { getWsGatewayUrl } from "@/lib/gateway";
import { useLang } from "@/app/context/LangContext";
const COUNTDOWN_TIME =5; // 5 seconds countdown
export default function Game3D() {
    const { lang } = useLang()!;
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const sceneRef = useRef<BABYLON.Scene | null>(null);
    const engineRef = useRef<BABYLON.Engine | null>(null);
    /////////////////////////////////
    const wsRef = useRef<WebSocket | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [playerId, setPlayerId] = useState<string | null>(null);
    const playerIdRef = useRef<string | null>(null);
  
    const [roomId, setRoomId] = useState<string | null>(null);
    const [messagee, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [youropponentDisconnected, setyouropponentDisconnected] = useState<boolean>(false);
    
  
    // Paddle state
    const [P_me_paddleY, setP_me_PaddleY] = useState<number>(-28); // Starting position
    const [P_2_paddleY, setP_2_PaddleY] = useState<number>(-28); // Starting position
    const P_me_paddleY_REF  = useRef<number>(-28); // Starting position
    const P_2_paddleY_REF  = useRef<number>(-28); // Starting position
    const lastPaddleMove = useRef<{ direction: number; time: number } | null>(null);

    const [gameRunning, setGameRunning] = useState<boolean>(false);
    const [openTheGame, setopenTheGame] = useState<boolean>(false);

    // Ball state from server
    const ballPositionRef = useRef({ x: 0, y: 57, z: -28.5 });
    const ballVelocityRef = useRef({ x: 0, y: 0, z: 0 });

    // Scores
    const [myScore, setMyScore] = useState<number>(0);
    const [opponentScore, setOpponentScore] = useState<number>(0);

    //gameover
    const [gameOver, setGameOver] = useState< string |boolean>(false);

      // Countdown
    const [countdown, setCountdown] = useState<number | null>(null);
    

    /////////////////////////////
    
    useEffect(() => {
        if (!canvasRef.current) return;
    
        // Initialize Babylon.js engine and scene
        const canvas = canvasRef.current;
        const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
        const scene = new BABYLON.Scene(engine);
    
        // Store references
        engineRef.current = engine;
        sceneRef.current = scene;
    
        // Create camera
        const camera = new BABYLON.ArcRotateCamera(
            "camera",
            Math.PI/2,
            Math.PI/4,
            190,
            new BABYLON.Vector3(0, 55, -30),
            scene
        );

        camera.attachControl(canvas, true);
        camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput");     
        scene.activeCamera = camera;
        
        // Create lighting
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;
        
        const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -1, -1), scene);
        dirLight.position = new BABYLON.Vector3(20, 20, 0);

        // References to paddle meshes
        let paddle1 = null;
        let paddle2 = null;
        let ball = null;
        let map = null;
        
        // Ball physics variables - MEDIUM JUMP PHYSICS
        let ballVelocity = new BABYLON.Vector3(1.2, 0.25, 0.4); // MEDIUM starting velocity
        let gravity = -0.018; // MEDIUM gravity
        let ballRadius = 2; 
        let tableY = 53; 
        let tableMinX = -60; 
        let tableMaxX = 60;
        let tableMinZ = -58;
        let tableMaxZ = 1;
        let bounceDamping = 0.65; // MEDIUM bounce

        // Input handling
        const inputMap = {};
        
        // Keyboard event listeners
        scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    inputMap[kbInfo.event.code] = true;
                    break;
                case BABYLON.KeyboardEventTypes.KEYUP:
                    inputMap[kbInfo.event.code] = false;
                    break;
            }
        });

        canvas.addEventListener('keydown', (e) => {
            inputMap[e.code] = true;
            e.preventDefault();
        });
        
        canvas.addEventListener('keyup', (e) => {
            inputMap[e.code] = false;
            e.preventDefault();
        });

        // Movement parameters
        const paddleSpeed = 2;
        
        // Paddle movement bounds
        const paddle1MinZ = -50;
        const paddle1MaxZ = -7;
        const paddle2MinZ = -50;
        const paddle2MaxZ = -7;

        // Paddle angle parameters
        const maxPaddleAngle = Math.PI / 6; 
        const paddleCenterZ = (paddle1MinZ + paddle1MaxZ) / 2; 
        const paddleRange = paddle1MaxZ - paddle1MinZ; 

        const calculatePaddleAngle = (paddleZ, isPlayer1) => {
            const normalizedPosition = (paddleZ - paddleCenterZ) / (paddleRange / 2);
            const angle = -normalizedPosition * maxPaddleAngle;
            return isPlayer1 ? -angle : angle;
        };

        // ========== IMPORT EXTERNAL 3D MODELS ==========
        // MAP
        BABYLON.SceneLoader.ImportMesh("", "./models/", "low_poly_scene_forest_waterfall.glb", scene, (meshes) => {
            if (meshes.length > 0) {
                    map = meshes[0];
                    map.position = new BABYLON.Vector3(-130,  32, 0); // MEDIUM height start
                    map.scaling = new BABYLON.Vector3(20, 20, 20);
                }
            }, (progress) => {
                console.log("map Loading progress:", progress);
            }, (error) => {
                console.log("Error loading map model:", error);
                map = BABYLON.MeshBuilder.CreateSphere("fallbackmap", { diameter: 2 }, scene);
                map.position = new BABYLON.Vector3(0, tableY + 5, -28.5); // MEDIUM height start
            });

        // Ball
        BABYLON.SceneLoader.ImportMesh("", "./models/", "beach_ball.glb", scene, (meshes) => {
            if (meshes.length > 0) {
                ball = meshes[0];
                ball.position = new BABYLON.Vector3(0, tableY + 5, -28.5); // MEDIUM height start
                ball.scaling = new BABYLON.Vector3(1, 1, 1);
            }
        }, (progress) => {
            console.log("Ball Loading progress:", progress);
        }, (error) => {
            console.log("Error loading ball model:", error);
            ball = BABYLON.MeshBuilder.CreateSphere("fallbackBall", { diameter: 2 }, scene);
            ball.position = new BABYLON.Vector3(0, tableY + 5, -28.5); // MEDIUM height start
        });

        // Table
        BABYLON.SceneLoader.ImportMesh("", "./models/", "Untitled_.glb", scene, (meshes) => {
            if (meshes.length > 0) {
                const rootMesh = meshes[0];
                rootMesh.position = new BABYLON.Vector3(0, 0, 0);
                rootMesh.scaling = new BABYLON.Vector3(10, 10, 12);
            }
        }, (progress) => {
            console.log("Table Loading progress:", progress);
        }, (error) => {
            console.log("Error loading table model:", error);
            const fallbackTable = BABYLON.MeshBuilder.CreateBox("fallbackTable", { width: 120, height: 5, depth: 60 }, scene);
            fallbackTable.position = new BABYLON.Vector3(0, 47.5, -28.5);
        });

        // Paddle Player 1 (Right side)
        BABYLON.SceneLoader.ImportMesh("", "./models/", "raqueta_de_ping_pong.glb", scene, (meshes) => {
            if (meshes.length > 0) {
                paddle1 = meshes[0];
                paddle1.position = new BABYLON.Vector3(60, 50, -28.5);
                paddle1.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
                paddle1.scaling = new BABYLON.Vector3(0.8, 0.8, 0.8);
            }
        }, (progress) => {
            console.log("Paddle 1 Loading progress:", progress);
        }, (error) => {
            console.log("Error loading paddle 1 model:", error);
            paddle1 = BABYLON.MeshBuilder.CreateBox("fallbackPaddle1", { width: 8, height: 12, depth: 1 }, scene);
            paddle1.position = new BABYLON.Vector3(60, 50, -28.5);
        });

        // Paddle Player 2 (Left side)
        BABYLON.SceneLoader.ImportMesh("", "./models/", "raqueta_de_ping_pong.glb", scene, (meshes) => {
            if (meshes.length > 0) {
                paddle2 = meshes[0];
                paddle2.position = new BABYLON.Vector3(-60, 50, -28.5);
                paddle2.rotation = new BABYLON.Vector3(0, -Math.PI/2, 0);
                paddle2.scaling = new BABYLON.Vector3(0.8, 0.8, 0.8);
            }
        }, (progress) => {
            console.log("Paddle 2 Loading progress:", progress);
        }, (error) => {
            console.log("Error loading paddle 2 model:", error);
            paddle2 = BABYLON.MeshBuilder.CreateBox("fallbackPaddle2", { width: 8, height: 12, depth: 1 }, scene);
            paddle2.position = new BABYLON.Vector3(-60, 50, -28.5);
        });


         // Update ball position from server data (replaces updateBallPhysics)
         const updateBallFromServer = () => {
            if (!ball) return;
            
            // Smoothly interpolate to server position for better visual experience
            const serverPos = ballPositionRef.current;
            const currentPos = ball.position;
            
            // Simple linear interpolation for smoother movement
            const lerpFactor = 0.8; // Adjust this value (0-1) for smoothness vs accuracy
            
            ball.position.x = currentPos.x + (serverPos.x - currentPos.x) * lerpFactor;
            ball.position.y = currentPos.y + (serverPos.y - currentPos.y) * lerpFactor;
            ball.position.z = currentPos.z + (serverPos.z - currentPos.z) * lerpFactor;
        };

        // Ball physics - MEDIUM JUMPS
        const updateBallPhysics = () => {
            if (!ball) return;
            
            // Apply gravity
            ballVelocity.y += gravity;
            
            // Update position
            ball.position.x += ballVelocity.x;
            ball.position.y += ballVelocity.y;
            ball.position.z += ballVelocity.z;
            
            // Table bounce - MEDIUM HEIGHT
            if (ball.position.y <= tableY + ballRadius && ballVelocity.y < 0) {
                if (ball.position.x >= tableMinX && ball.position.x <= tableMaxX &&
                    ball.position.z >= tableMinZ && ball.position.z <= tableMaxZ) {
                    
                    ball.position.y = tableY + ballRadius;
                    ballVelocity.y = Math.abs(ballVelocity.y) * bounceDamping; // MEDIUM bounce
                    
                    // Ensure MEDIUM bounce height
                    if (ballVelocity.y < 0.15) ballVelocity.y = 0.18; // Minimum MEDIUM bounce
                    if (ballVelocity.y > 0.55) ballVelocity.y = 0.5; // Maximum MEDIUM bounce
                }
            }

            // Wall bounces
            if (ball.position.z <= tableMinZ || ball.position.z >= tableMaxZ) {
                ballVelocity.z *= -1; 
                ball.position.z = ball.position.z <= tableMinZ ? tableMinZ : tableMaxZ;
            }
            
            checkPaddleCollision();

            // Reset if out of bounds
            if (ball.position.y < 20 || Math.abs(ball.position.x) > 100) {
                resetBall();
            }
        };
        
        // Paddle hits - MEDIUM JUMPS
        const checkPaddleCollision = () => {
            if (!ball || !paddle1 || !paddle2) return;
            
            const ballPos = ball.position;
            
            // Player 1 paddle
            if (paddle1 && ballPos.x > 55 && ballPos.x < 65 && 
                Math.abs(ballPos.z - paddle1.position.z) < 8 && 
                Math.abs(ballPos.y - paddle1.position.y) < 16 &&
                ballVelocity.x > 0) 
            {
                const paddleAngle = paddle1.rotation.z;
                const hitOffset = (ballPos.z - paddle1.position.z) / 8;
                
                // MEDIUM jump from paddle
                ballVelocity.x = -Math.abs(ballVelocity.x) * 1.05;
                ballVelocity.y = Math.random() * (0.7 - 0.25) + 0.25; // FIXED MEDIUM jump height
                ballVelocity.z = hitOffset * 1.0;
                
                console.log("P1 hit - MEDIUM jump Y:", ballVelocity.y);
            }
            
            // Player 2 paddle
            if (paddle2 && ballPos.x > -65 && ballPos.x < -55 && 
                Math.abs(ballPos.z - paddle2.position.z) < 8 && 
                Math.abs(ballPos.y - paddle2.position.y) < 16 &&
                ballVelocity.x < 0) 
            {
                const paddleAngle = paddle2.rotation.z;
                const hitOffset = (ballPos.z - paddle2.position.z) / 8;
                
                // MEDIUM jump from paddle
                ballVelocity.x = Math.abs(ballVelocity.x) * 1.05;
                ballVelocity.y = Math.random() * (0.7 - 0.25) + 0.25; // FIXED MEDIUM jump height
                ballVelocity.z = hitOffset * 1.0;
                
                console.log("P2 hit - MEDIUM jump Y:", ballVelocity.y);
            }
        };
        
        // Reset with MEDIUM start
        const resetBall = () => {
            if (!ball) return;
            ball.position = new BABYLON.Vector3(0, tableY + 5, -28.5); // MEDIUM start height
            
            ballVelocity = new BABYLON.Vector3(
                Math.random() > 0.5 ? 1.2 : -1.2,
                0.25, // MEDIUM starting jump
                (Math.random() - 0.5) * 0.6
            );
            
            console.log("Reset - MEDIUM start Y velocity:", ballVelocity.y);
        };

        // Paddle movement
        const updatePaddles = () => {
            if (paddle1) {
                if (inputMap['ArrowLeft'] && paddle1.position.z > paddle1MinZ) {
                    paddle1.position.z -= paddleSpeed;
                    sendPaddleMove(paddle1.position.z);
                }
                if (inputMap['ArrowRight'] && paddle1.position.z < paddle1MaxZ) {
                    paddle1.position.z += paddleSpeed;
                    sendPaddleMove(paddle1.position.z);
                }
                
                const angle = calculatePaddleAngle(paddle1.position.z, true);
                paddle1.rotation.y = Math.PI / 2; 
                paddle1.rotation.z = angle; 
            }

            if (paddle2) 
            {

                // paddle2.position.z = P_2_paddleY;
                paddle2.position.z = P_2_paddleY_REF.current;
                // if (inputMap['KeyA'] && paddle2.position.z > paddle2MinZ) {
                //     paddle2.position.z -= paddleSpeed;
                //     // sendPaddleMove(paddle2.position.z);
                // }
                // if (inputMap['KeyD'] && paddle2.position.z < paddle2MaxZ) {
                //     paddle2.position.z += paddleSpeed;
                //     // sendPaddleMove(paddle2.position.z);
                // }
                
                const angle = calculatePaddleAngle(paddle2.position.z, false);
                paddle2.rotation.y = -Math.PI / 2; 
                paddle2.rotation.z = angle; 
            }
        };
        
        // Render loop
        engine.runRenderLoop(() => {
            if (scene) {
                updatePaddles(); 
                // updateBallPhysics(); 
                updateBallFromServer(); // Use server ball position instead of physics
                scene.render();
            }
        });

        return () => {
            engine.dispose();
        };

    }, []);
    ////////////////////////////
  
      // Add this useEffect to handle the countdown timer
    useEffect(() => 
    {
        if (openTheGame && !gameRunning) 
        {
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

    const connectToServer = () => 
    {
      if (connectionStatus === 'connected') {
        // If already connected, disconnect
        if (wsRef.current) {
          wsRef.current.close();
        }
        return;
      }
  
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL_3D || getWsGatewayUrl("/ws/game/ws/3d");
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
        // console.log('📨 Received message from server:', event.data);
  
        try 
        {
          const data = JSON.parse(event.data);
          handleServerMessage(data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
  
      ws.onclose = (event) => {
        console.log('❌ WebSocket disconnected', event.code, event.reason);
        setConnectionStatus('disconnected');
      };
  
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('disconnected');
        wsRef.current = null;
      };
    };
    const disconnectFromServer = () => {
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
          setConnectionStatus('disconnected');
          setPlayerId(null);
          setMessage(null);
          setRoomId(null);
          setIsLoading(false);
          setGameRunning(false);
          setopenTheGame(false);
            setGameOver(false);
        }
      };
    
    const handleServerMessage = useCallback((data: any) => 
    {
      switch (data.type) {
        case 'matchFound':
          setMessage(data.message);
          setRoomId(data.gameId);
          setIsLoading(false);
          setopenTheGame(true);
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
          // setMessage(data.message);
          setGameOver(data.message);
          setIsLoading(false);
          // setRoomId(null);
          setGameRunning(false);
          setopenTheGame(false);
          setGameRunning(false);
          setyouropponentDisconnected(true);
          // console.log('Opponent disconnected:', data.message);
          break;
        case 'gameStarted':
          setMessage(data.message);
          setIsLoading(false);
          setGameRunning(true);
          console.log('Game started:', data.message);
          break;
        case 'waitingForOpponent':
          setMessage(data.message);
          setIsLoading(true);
          console.log(`Waiting for opponent: ${data.message}`);
          break;
        case 'playerId':
            playerIdRef.current = data.playerId; // ✅ instant availability
            setPlayerId(data.playerId);          // ✅ triggers re-render for UI
            console.log(`🎮 Your player ID in B: ${playerId}`);
            console.log(`🎮 Your player ID in S: ${data.playerId}`);
          break;
        case 'gameState_3D':
            const myId = playerIdRef.current;
            if (!myId) return; // now this will work after first message

            if (data.gameState?.players) {
                const myPlayer = data.gameState.players.find((p: any) => p.id === myId);
                const opponent = data.gameState.players.find((p: any) => p.id !== myId);
                // console.log('xxxGame state received:', { myPlayerPaddleY: myPlayer.paddleY, opponentPaddleY: opponent.paddleY });
                if (myPlayer)
                {
                  setP_me_PaddleY(myPlayer.paddleY);
                  P_2_paddleY_REF.current = myPlayer.paddleY;
                  setMyScore(myPlayer.score);
                } 
                if (opponent) 
                {
                  setP_2_PaddleY(opponent.paddleY);
                    P_2_paddleY_REF.current = opponent.paddleY;
                  setOpponentScore(opponent.score);
                    
                }

            }

            // 🔧 NEW: Update ball position from server
            if (data.gameState) {
                console.log('xxxBall position received:', {
                    x: data.gameState.ballX,
                    y: data.gameState.ballY,
                    z: data.gameState.ballZ
                });
                ballPositionRef.current = {
                    x: data.gameState.ballX || 0,
                    y: data.gameState.ballY || 57,
                    z: data.gameState.ballZ || -28.5
                };
                
                ballVelocityRef.current = {
                    x: data.gameState.ballVelocityX || 0,
                    y: data.gameState.ballVelocityY || 0,
                    z: data.gameState.ballVelocityZ || 0
                };
            }
            break;
        case 'gameOver':
          setGameOver(data.message);
          setIsLoading(false);
          setGameRunning(false);
          console.log('Game Over:', data.message);
          break;

          case 'gameReset':
            setMessage(data.message);
            setGameOver(false);
            setMyScore(0);
            setOpponentScore(0);
            setGameRunning(false);
            setopenTheGame(false); // This will trigger countdown via useEffect
            console.log('Game reset:', data.message);
          break;
  
        default:
          console.log('Unknown message type:', data.type);
      }
    }, [playerId]);

    // Send paddle movement to server (with throttling)
    const sendPaddleMove = useCallback((direction: number) => 
    {
        
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const now = Date.now();
        if (lastPaddleMove.current && 
            lastPaddleMove.current.direction === direction && 
            now - lastPaddleMove.current.time < 16) { // ~60fps throttling
          return;
        }

        wsRef.current.send(JSON.stringify({
          type: 'paddleMove3D',
          direction,
        }));

        lastPaddleMove.current = { direction, time: now };
    }, []);

    useEffect(() => {
        connectToServer();
        if( wsRef.current ) 
        {
            wsRef.current.onopen = () => 
            {
                wsRef.current?.send(JSON.stringify(
                {

                    type: 'gameType', 
                    game:'3D'

                }));
            };
        }
      }, []);

      const resetGame = () => {
        if (wsRef.current) {
            wsRef.current.send(JSON.stringify({ type: 'resetGame' }));
        }
        setGameOver(false);
        setMyScore(0);
        setOpponentScore(0);
        setopenTheGame(true);
        setGameRunning(true);
        setCountdown(null);
      }
    

    return (
        <div className="w-full h-screen relative">
            
            {/* --- BACK BUTTON --- */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 -ml-20 z-50">
            </div>
            
            <div className="absolute top-6 left-6 z-50">
                <Link 
                    href="/" 
                    onClick={() => disconnectFromServer()}
                    className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-black/60 backdrop-blur-sm hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all duration-300 group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold text-sm tracking-wide uppercase">{lang === "eng" ? "Home" : "Accueil"}</span>
                </Link>
            </div>
            
        <canvas 
                ref={canvasRef} 
                className='w-full h-full outline-none'
                tabIndex={0}
            />
            
            {/* Countdown Overlay */}
      {countdown && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-9xl font-bold text-white animate-pulse drop-shadow-2xl">
              {countdown}
            </div>
            <p className="text-2xl text-white mt-4">{lang === "eng" ? "Get Ready!" : "Préparez-vous!"}</p>
          </div>
        </div>
      )}
            {gameOver &&
                 (
                    <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center">
                      <div className="text-center space-y-6 max-w-md mx-auto px-6">
                        <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
                        <h2 className="text-4xl font-bold text-white">{gameOver}</h2>
                        <div className="text-xl text-gray-300">
                          {lang === "eng" ? "Final Score" : "Score final"}: {myScore} - {opponentScore}
                        </div>
                        {/* {!youropponentDisconnected ?<button
                          onClick={() => {
                            resetGame();
                          }}
                          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
                        >
                          {lang === "eng" ? "Play Again" : "Jouer à nouveau"}
                        </button>:
                        <button
                          onClick={() => {
                            disconnectFromServer();
                          }}
                          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
                        >
                          {lang === "eng" ? "Quit" : "Quitter"}
                        </button>
                        
                        } */}
                      </div>
                    </div>
                  )
            }
            {gameRunning &&
                 <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                 <div className="bg-black bg-opacity-60 text-white px-8 py-4 rounded-xl backdrop-blur-sm">
                   <div className="text-4xl font-bold text-center">
                     {myScore} - {opponentScore}
                   </div>
                 </div>
               </div>
            }
            {/* <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-4 rounded">
                <div className="text-sm">
                    <div>🏓 you are {connectionStatus}</div>
                    <div>🏓 you ID {playerId}</div>
                    <div>🏓 Rome ID {roomId}</div>
    
                   
                </div>

                
            </div> */}

            {/* Controls Instructions  */}
            {/* {gameRunning && ( */}
                <div className="absolute bottom-6 right-6 bg-black bg-opacity-80 backdrop-blur-md text-white p-4 rounded-2xl border border-cyan-400/30 shadow-xl">
                    <div className="text-sm space-y-2">
                        <div className="text-cyan-400 font-semibold mb-2 flex items-center gap-2">
                            <GamepadIcon className="w-4 h-4" />
                            {lang === "eng" ? "CONTROLS" : "COMMANDES"}
                        </div>
                        <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">←</kbd>
                            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">→</kbd>
                            <span className="text-gray-300">{lang === "eng" ? "Move Paddle" : "Déplacer raquette"}</span>
                        </div>
                    </div>
                </div>
            {/* )} */}


<div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded-xl backdrop-blur-sm min-w-48">
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            {connectionStatus ==="disconnected" ? (
              <WifiOff className="w-4 h-4 text-red-500" />
            ) : (
              <Wifi className="w-4 h-4 text-green-500" />
            )}
            <span className="capitalize">{connectionStatus}</span>
          </div>
          
          {playerId && (
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-blue-400" />
              <span>ID: {playerId.slice(0, 8)}</span>
            </div>
          )}
           {/* {isLoading  && connectionStatus==="connecting" && (
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      )} */}

{isLoading && connectionStatus !== "disconnected" && (
                        <div className="flex items-center space-x-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-yellow-400 border-t-transparent"></div>
                            <span className="text-yellow-400 font-medium">
                                {lang === "eng" ? "Finding match..." : "Recherche de match..."}
                            </span>
                        </div>
                    )}
                    
          
           {roomId && (
                        <div className="flex items-center space-x-3">
                            <Users className="w-5 h-5 text-purple-400" />
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide">{lang === "eng" ? "Room" : "Salle"}</div>
                                <div className="font-mono text-purple-300 text-sm">
                                    {roomId.slice(0, 8)}
                                </div>
                            </div>
                        </div>
                    )}
          
        </div>
      </div>
        </div>
    );
}