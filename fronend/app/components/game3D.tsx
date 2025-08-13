"use client";

import React, { useEffect, useRef } from 'react';
import * as BABYLON from 'babylonjs';

const BabylonGame = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const engineRef = useRef(null);

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
      -Math.PI / 2,
      Math.PI / 2.5,
      10,
      BABYLON.Vector3.Zero(),
      scene
    );
    
    // Attach camera controls with proper error handling
    if (camera.attachControls) {
      camera.attachControls(canvas, true);
    } else {
      // Alternative method for different Babylon.js versions
      camera.setTarget(BABYLON.Vector3.Zero());
    }
    
    // Enable camera controls manually if attachControls doesn't work
    scene.activeCamera = camera;
    
    // Manual camera controls as fallback
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    
    canvas.addEventListener('pointerdown', (evt) => {
      isDragging = true;
      lastPointerX = evt.clientX;
      lastPointerY = evt.clientY;
      canvas.setPointerCapture(evt.pointerId);
    });
    
    canvas.addEventListener('pointerup', (evt) => {
      isDragging = false;
      canvas.releasePointerCapture(evt.pointerId);
    });
    
    canvas.addEventListener('pointermove', (evt) => {
      if (!isDragging) return;
      
      const deltaX = evt.clientX - lastPointerX;
      const deltaY = evt.clientY - lastPointerY;
      
      camera.alpha += deltaX * 0.01;
      camera.beta += deltaY * 0.01;
      
      // Limit beta to prevent camera flipping
      camera.beta = Math.max(0.1, Math.min(Math.PI - 0.1, camera.beta));
      
      lastPointerX = evt.clientX;
      lastPointerY = evt.clientY;
    });
    
    canvas.addEventListener('wheel', (evt) => {
      camera.radius += evt.deltaY * 0.01;
      camera.radius = Math.max(2, Math.min(50, camera.radius));
      evt.preventDefault();
    });

    // Create light
    const light = new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    light.intensity = 0.7;

    // Create ground
    const ground = BABYLON.MeshBuilder.CreateGround(
      "ground",
      { width: 20, height: 20 },
      scene
    );
    const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.2);
    ground.material = groundMaterial;

    // Create player (sphere)
    const player = BABYLON.MeshBuilder.CreateSphere(
      "player",
      { diameter: 0.2 },
      scene
    );
    player.position.y = 0.5;
    const playerMaterial = new BABYLON.StandardMaterial("playerMat", scene);
    playerMaterial.diffuseColor = new BABYLON.Color3(0, 0.5, 1);
    player.material = playerMaterial;

    // Create collectible items
    const collectibles = [];
    for (let i = 0; i < 5; i++) {
      const collectible = BABYLON.MeshBuilder.CreateBox(
        `collectible${i}`,
        { size: 0.5 },
        scene
      );
      collectible.position.x = Math.random() * 16 - 8;
      collectible.position.z = Math.random() * 16 - 8;
      collectible.position.y = 0.25;
      
      const collectibleMaterial = new BABYLON.StandardMaterial(`collectibleMat${i}`, scene);
      collectibleMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0);
      collectible.material = collectibleMaterial;
      
      collectibles.push(collectible);
    }

    // Create obstacles
    const obstacles = [];
    for (let i = 0; i < 3; i++) {
      const obstacle = BABYLON.MeshBuilder.CreateBox(
        `obstacle${i}`,
        { width: 2, height: 1, depth: 2 },
        scene
      );
      obstacle.position.x = Math.random() * 12 - 6;
      obstacle.position.z = Math.random() * 12 - 6;
      obstacle.position.y = 0.5;
      
      const obstacleMaterial = new BABYLON.StandardMaterial(`obstacleMat${i}`, scene);
      obstacleMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
      obstacle.material = obstacleMaterial;
      
      obstacles.push(obstacle);
    }

    // Game state
    let score = 0;
    let gameRunning = true;
    const playerSpeed = 0.1;
    
    // Input handling
    const inputMap = {};
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

    // Game loop
    scene.registerBeforeRender(() => {
      if (!gameRunning) return;

      // Player movement
      if (inputMap["KeyW"] || inputMap["ArrowUp"]) {
        player.position.z += playerSpeed;
      }
      if (inputMap["KeyS"] || inputMap["ArrowDown"]) {
        player.position.z -= playerSpeed;
      }
      if (inputMap["KeyA"] || inputMap["ArrowLeft"]) {
        player.position.x -= playerSpeed;
      }
      if (inputMap["KeyD"] || inputMap["ArrowRight"]) {
        player.position.x += playerSpeed;
      }

      // Keep player within bounds
      player.position.x = Math.max(-9, Math.min(9, player.position.x));
      player.position.z = Math.max(-9, Math.min(9, player.position.z));

      // Rotate collectibles
      collectibles.forEach((collectible, index) => {
        if (collectible.isEnabled()) {
          collectible.rotation.y += 0.02;
          
          // Check collision with player
          if (BABYLON.Vector3.Distance(player.position, collectible.position) < 1) {
            collectible.setEnabled(false);
            score += 10;
            updateScore();
          }
        }
      });

      // Check collision with obstacles
      obstacles.forEach((obstacle) => {
        if (BABYLON.Vector3.Distance(player.position, obstacle.position) < 1.5) {
          // Simple bounce back effect
          const direction = player.position.subtract(obstacle.position).normalize();
          player.position.addInPlace(direction.scale(0.1));
        }
      });

      // Check win condition
      if (collectibles.every(c => !c.isEnabled())) {
        gameRunning = false;
        setTimeout(() => {
          alert(`Congratulations! You collected all items! Final Score: ${score}`);
          restartGame();
        }, 100);
      }
    });

    // Update score display
    const updateScore = () => {
      const scoreElement = document.getElementById('score');
      if (scoreElement) {
        scoreElement.textContent = `Score: ${score}`;
      }
    };

    // Restart game function
    const restartGame = () => {
      score = 0;
      gameRunning = true;
      player.position = new BABYLON.Vector3(0, 0.5, 0);
      
      collectibles.forEach((collectible, index) => {
        collectible.setEnabled(true);
        collectible.position.x = Math.random() * 16 - 8;
        collectible.position.z = Math.random() * 16 - 8;
      });
      
      updateScore();
    };

    // Start render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle window resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, []);

  const handleRestart = () => {
    if (sceneRef.current) {
      // Reset player position
      const player = sceneRef.current.getMeshByName('player');
      if (player) {
        player.position = new BABYLON.Vector3(0, 0.5, 0);
      }

      // Re-enable all collectibles
      for (let i = 0; i < 5; i++) {
        const collectible = sceneRef.current.getMeshByName(`collectible${i}`);
        if (collectible) {
          collectible.setEnabled(true);
          collectible.position.x = Math.random() * 16 - 8;
          collectible.position.z = Math.random() * 16 - 8;
        }
      }

      // Reset score
      const scoreElement = document.getElementById('score');
      if (scoreElement) {
        scoreElement.textContent = 'Score: 0';
      }
    }
  };

  return (
    <div className="w-full h-screen bg-gray-900 relative">
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full  bg-amber-300 outline-none"
        tabIndex={0}
      />
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 text-white">
        <h1 className="text-2xl font-bold mb-2">3D Collector Game</h1>
        <div id="score" className="text-lg mb-2">Score: 0</div>
        <div className="text-sm opacity-75 mb-4">
          <div>Use WASD or Arrow Keys to move</div>
          <div>Collect all yellow cubes to win!</div>
          <div>Avoid red obstacles</div>
        </div>
        <button
          onClick={handleRestart}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
        >
          Restart Game
        </button>
      </div>

      {/* Performance Info */}
      <div className="absolute top-4 right-4 text-white text-sm opacity-75">
        <div>Camera: Mouse to rotate view</div>
        <div>Scroll: Zoom in/out</div>
      </div>
    </div>
  );
};

export default BabylonGame;