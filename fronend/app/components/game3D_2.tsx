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
        
        // Ball physics variables
        let ballVelocity = new BABYLON.Vector3(0.5, 0, 0.5); // Initial velocity (x, y, z)
        let ballDirection = new BABYLON.Vector3(0.5, 0, 0.5).normalize(); // Direction vector (normalized)
        let ballSpeed = 1.5; // Constant speed magnitude
        let gravity = -0.3; // Gravity force
        let ballRadius = 1; // Ball radius for collision
        let tableY = 53; // Table surface Y position
        let tableMinX = -60; // Table boundaries
        let tableMaxX = 60;
        let tableMinZ = -58;
        let tableMaxZ = 1;
        let bounceDamping = 0.8; // Energy loss on bounce
        let paddleHitForce = 5; // Force when paddle hits ball

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

        // Alternative: Add event listeners to canvas for better compatibility
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
        const tableWidth = 120; // Adjust based on your table size
        const tableHeight = 70;  // Adjust based on your table size
        
        // Paddle movement bounds
        const paddle1MinZ = -50;
        const paddle1MaxZ = -7;
        const paddle1MinY = 45;
        const paddle1MaxY = 65;
        
        const paddle2MinZ = -50;
        const paddle2MaxZ = -7;
        const paddle2MinY = 45;
        const paddle2MaxY = 65;

        // Paddle angle parameters for realistic curvature
        const maxPaddleAngle = Math.PI / 6; // 30 degrees maximum tilt
        const paddleCenterZ = (paddle1MinZ + paddle1MaxZ) / 2; // Center position of paddle movement
        const paddleRange = paddle1MaxZ - paddle1MinZ; // Total movement range

        // Function to calculate paddle angle based on position
        const calculatePaddleAngle = (paddleZ, isPlayer1) => {
            // Calculate how far from center (0 = center, -1 = left edge, 1 = right edge)
            const normalizedPosition = (paddleZ - paddleCenterZ) / (paddleRange / 2);
            
            // Create angle that increases towards edges (inverted)
            const angle = -normalizedPosition * maxPaddleAngle;
            
            // For player 1 (right side), we want the opposite angle direction
            return isPlayer1 ? -angle : angle;
        };

        // ========== IMPORT EXTERNAL 3D MODELS ==========
        
        // Ball
        BABYLON.SceneLoader.ImportMesh("", "./models/", "beach_ball.glb", scene, (meshes) => {
            console.log("Ball Model loaded:", meshes);
            
            if (meshes.length > 0) {
                ball = meshes[0];
                ball.position = new BABYLON.Vector3(0, 55, -28.5);
                ball.scaling = new BABYLON.Vector3(1, 1, 1);
            }
        }, (progress) => {
            console.log("Ball Loading progress:", progress);
        }, (error) => {
            console.log("Error loading ball model:", error);
            // Fallback ball
            ball = BABYLON.MeshBuilder.CreateSphere("fallbackBall", { diameter: 2 }, scene);
            ball.position = new BABYLON.Vector3(0, 55, -28.5);
        });

        // Table
        BABYLON.SceneLoader.ImportMesh("", "./models/", "Untitled_.glb", scene, (meshes) => {
            console.log("Table Model loaded:", meshes);
            
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
            console.log("Paddle 1 Model loaded:", meshes);
            
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
            console.log("Paddle 2 Model loaded:", meshes);
            
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

        // Ball physics update function
        const updateBallPhysics = () => {
            if (!ball) return;
            
            // Apply gravity
            // ballVelocity.y += gravity;
            
            // Update ball position
            // ball.position.x += ballVelocity.x;
            // ball.position.y += ballVelocity.y;
            // ball.position.z += ballVelocity.z;


            ball.position.x += ballDirection.x * ballSpeed;
            // ball.position.y += ballDirection.y * ballSpeed;
            ball.position.z += ballDirection.z * ballSpeed;
            
            // Table collision (bounce)
            ///gravity
            // if (ball.position.y <= tableY + ballRadius && ballVelocity.y < 0) {
            //     // Check if ball is within table bounds
            //     if (ball.position.x >= tableMinX && ball.position.x <= tableMaxX &&
            //         ball.position.z >= tableMinZ && ball.position.z <= tableMaxZ) {
            //         ball.position.y = tableY + ballRadius;
            //         ballVelocity.y = Math.abs(ballVelocity.y) * bounceDamping;
            //     }
            // }
            
            // // Wall bounces (Z-axis - left/right sides of table)
            // if (ball.position.z <= tableMinZ || ball.position.z >= tableMaxZ) {
            //     ballVelocity.z *= -0.9; // Reverse and dampen
            //     ball.position.z = ball.position.z <= tableMinZ ? tableMinZ  : tableMaxZ ;
            // }

            // Wall bounces (Z-axis - left/right sides of table)
            if (ball.position.z <= tableMinZ || ball.position.z >= tableMaxZ) {
                ballDirection.z *= -1; // Reverse Z direction, keep same speed
                ball.position.z = ball.position.z <= tableMinZ ? tableMinZ : tableMaxZ;
            }
            
            // Paddle collision detection
            checkPaddleCollision();


            
            // Reset ball if it falls too low or goes too far
            if (ball.position.y < 20 || Math.abs(ball.position.x) > 100) {
                resetBall();
            }
        };
        
        // Paddle collision detection
        const checkPaddleCollision = () => {
            if (!ball || !paddle1 || !paddle2) return;
            
            const ballPos = ball.position;
            
            // Player 1 paddle collision (right side)
            if (paddle1 && ballPos.x > 55 && ballPos.x < 65 && 
                Math.abs(ballPos.z - paddle1.position.z) < 8 ) 
            {
                    console.log("Collision with Player 1 paddle");
                
                // Calculate new direction based on paddle angle and position
                const paddleAngle = paddle1.rotation.z;
                const hitOffset = (ballPos.z - paddle1.position.z) / 8; // Normalized hit position
                
                // Create new direction vector
                ballDirection.x = -1; // Reverse X direction
                // ballDirection.y = paddleAngle * 2; // Y direction based on paddle angle
                ballDirection.z = hitOffset * 0.8; // Z direction based on hit position
                
                // Normalize to maintain constant speed
                ballDirection.normalize();
                
                // Optional: Add slight speed boost on paddle hit
                ballSpeed = Math.min(ballSpeed * 1.02, 2.5); // Max speed cap of 2.5
            }
            
            // Player 2 paddle collision (left side)
            if (paddle2 && ballPos.x > -65 && ballPos.x < -55 && 
                Math.abs(ballPos.z - paddle2.position.z) < 8) 
            {
                console.log("Collision with Player 2 paddle");
                  // Calculate new direction based on paddle angle and position
                const paddleAngle = paddle2.rotation.z;
                const hitOffset = (ballPos.z - paddle2.position.z) / 8; // Normalized hit position
                
                // Create new direction vector
                ballDirection.x = 1; // Reverse X direction
                // ballDirection.y = paddleAngle * 2; // Y direction based on paddle angle
                ballDirection.z = hitOffset * 0.8; // Z direction based on hit position
                
                // Normalize to maintain constant speed
                ballDirection.normalize();
                
                // Optional: Add slight speed boost on paddle hit
                ballSpeed = Math.min(ballSpeed * 1.02, 2.5); // Max speed cap of 2.5
            }
        };
        
        // Reset ball to center
        const resetBall = () => {
            // if (!ball) return;
            // ball.position = new BABYLON.Vector3(0, 55, -28.5);
            // ballVelocity = new BABYLON.Vector3(
            //     Math.random() > 0.5 ? 3 : -3, // Random direction
            //     1,
            //     (Math.random() - 0.5)
            // );



            if (!ball) return;
            ball.position = new BABYLON.Vector3(0, 55, -28.5);
            
            // Create random direction but maintain constant speed
            ballDirection = new BABYLON.Vector3(
                Math.random() > 0.5 ? 1 : -1, // Random X direction
                (Math.random() - 0.5) * 0.3,  // Small Y component
                (Math.random() - 0.5) * 0.5   // Random Z component
            ).normalize(); // Normalize to unit vector
            
            // Reset to base speed
            ballSpeed = 1.5;
        };
        // Update function for paddle movement (left/right only)
        const updatePaddles = () => {
            // Player 1 controls (Right paddle) - Left/Right Arrow Keys
            if (paddle1) {
                if (inputMap['ArrowLeft'] && paddle1.position.z > paddle1MinZ) {
                    paddle1.position.z -= paddleSpeed;
                }
                if (inputMap['ArrowRight'] && paddle1.position.z < paddle1MaxZ) {
                    paddle1.position.z += paddleSpeed;
                }
                
                // Apply realistic angle based on position (rotation around Z-axis)
                const angle = calculatePaddleAngle(paddle1.position.z, true);
                paddle1.rotation.y = Math.PI / 2; // Keep base rotation
                paddle1.rotation.z = angle; // Apply curvature angle around Z-axis
            }

            // Player 2 controls (Left paddle) - A/D Keys
            if (paddle2) {
                if (inputMap['KeyA'] && paddle2.position.z > paddle2MinZ) {
                    paddle2.position.z -= paddleSpeed;
                }
                if (inputMap['KeyD'] && paddle2.position.z < paddle2MaxZ) {
                    paddle2.position.z += paddleSpeed;
                }
                
                // Apply realistic angle based on position (rotation around Z-axis)
                const angle = calculatePaddleAngle(paddle2.position.z, false);
                paddle2.rotation.y = -Math.PI / 2; // Keep base rotation
                paddle2.rotation.z = angle; // Apply curvature angle around Z-axis
            }
        };
        
        // Render loop
        engine.runRenderLoop(() => {
            if (scene) {
                updatePaddles(); // Update paddle positions
                updateBallPhysics(); // Update ball physics
                scene.render();
            }
        });

        // Cleanup function
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
            
            {/* Instructions overlay */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-4 rounded">
                <h3 className="font-bold mb-2">Ping Pong Controls:</h3>
                <div className="text-sm space-y-1">
                    <div className="font-semibold text-yellow-300">Player 1 (Right Paddle):</div>
                    <div>• ← →: Move Left/Right</div>
                    
                    <div className="font-semibold text-blue-300 mt-3">Player 2 (Left Paddle):</div>
                    <div>• A/D: Move Left/Right</div>
                    
                    <div className="font-semibold text-green-300 mt-3">Realistic Physics:</div>
                    <div>• Ball bounces with gravity</div>
                    <div>• Paddle angle affects ball trajectory</div>
                    <div>• Ball resets if it falls or goes off table</div>
                    
                    <div className="font-semibold text-gray-300 mt-3">Camera:</div>
                    <div>• Mouse: Rotate view</div>
                    <div>• Scroll: Zoom in/out</div>
                </div>
            </div>

            {/* Game status */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-4 rounded">
                <div className="text-sm">
                    <div>🏓 Ping Pong Game</div>
                    <div className="text-xs mt-2 text-gray-300">Click on canvas to focus for controls</div>
                </div>
            </div>
        </div>
    );
}