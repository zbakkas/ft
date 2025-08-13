"use client";
import * as BABYLON from 'babylonjs';
import React, { useEffect, useRef } from 'react';
import 'babylonjs-loaders';

export default function Game3D() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const sceneRef = useRef<BABYLON.Scene | null>(null);
    const engineRef = useRef<BABYLON.Engine | null>(null);
    
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
            120,
            new BABYLON.Vector3(0, 55, -30),
            scene
        );

        camera.attachControl(canvas, true);
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
                }
                if (inputMap['ArrowRight'] && paddle1.position.z < paddle1MaxZ) {
                    paddle1.position.z += paddleSpeed;
                }
                
                const angle = calculatePaddleAngle(paddle1.position.z, true);
                paddle1.rotation.y = Math.PI / 2; 
                paddle1.rotation.z = angle; 
            }

            if (paddle2) {
                if (inputMap['KeyA'] && paddle2.position.z > paddle2MinZ) {
                    paddle2.position.z -= paddleSpeed;
                }
                if (inputMap['KeyD'] && paddle2.position.z < paddle2MaxZ) {
                    paddle2.position.z += paddleSpeed;
                }
                
                const angle = calculatePaddleAngle(paddle2.position.z, false);
                paddle2.rotation.y = -Math.PI / 2; 
                paddle2.rotation.z = angle; 
            }
        };
        
        // Render loop
        engine.runRenderLoop(() => {
            if (scene) {
                updatePaddles(); 
                updateBallPhysics(); 
                scene.render();
            }
        });

        return () => {
            engine.dispose();
        };

    }, []);
    
    return (
        <div className="w-full h-screen relative">
            <canvas 
                ref={canvasRef} 
                className='w-full h-full outline-none'
                tabIndex={0}
            />
            
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-4 rounded">
                <h3 className="font-bold mb-2">Ping Pong Controls:</h3>
                <div className="text-sm space-y-1">
                    <div className="font-semibold text-yellow-300">Player 1 (Right Paddle):</div>
                    <div>• ← →: Move Left/Right</div>
                    
                    <div className="font-semibold text-blue-300 mt-3">Player 2 (Left Paddle):</div>
                    <div>• A/D: Move Left/Right</div>
                    
                    <div className="font-semibold text-green-300 mt-3">MEDIUM Jump Physics:</div>
                    <div>• Ball jumps at MEDIUM height (0.25)</div>
                    <div>• Consistent MEDIUM bounces</div>
                    <div>• Not too high, not too low</div>
                    <div>• Perfect MEDIUM ping pong feel</div>
                </div>
            </div>

            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-4 rounded">
                <div className="text-sm">
                    <div>🏓 MEDIUM Jump Ping Pong</div>
                    <div className="text-xs mt-2 text-gray-300">Perfect medium height jumps!</div>
                </div>
            </div>
        </div>
    );
}