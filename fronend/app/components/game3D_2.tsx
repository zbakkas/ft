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
            -Math.PI ,
            Math.PI / 3,
            180,
            new BABYLON.Vector3(0, 55, -30),
            scene
        );

        // Fix camera controls - use attachControl (not attachControls)
        camera.attachControl(canvas, true);
        
        // Alternative manual camera controls if attachControl doesn't work
        scene.activeCamera = camera;
        
        // Create lighting
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;
        
        // Add directional light for better shadows
        const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -1, -1), scene);
        dirLight.position = new BABYLON.Vector3(20, 20, 0);

     
      

        // ========== IMPORT EXTERNAL 3D MODELS ==========
        
        // // ping ball
        BABYLON.SceneLoader.ImportMesh("", "./models/", "beach_ball.glb", scene, (meshes) => {
            // Model loaded successfully
            console.log("GLB Model loaded:", meshes);
            
            // Position the imported model
            if (meshes.length > 0) {
                const rootMesh = meshes[0];
                rootMesh.position = new BABYLON.Vector3(0, 55, -28.5);
                rootMesh.scaling = new BABYLON.Vector3(1, 1, 1); // Scale if needed
            }
        }, (progress) => {
            // Loading progress
            console.log("Loading progress:", progress);
        }, (error) => {
            console.log("Error loading GLB model:", error);
            // Fallback: create a simple box if model fails to load
            const fallbackBox = BABYLON.MeshBuilder.CreateBox("fallback", { size: 1 }, scene);
            fallbackBox.position = new BABYLON.Vector3(0, 0, 0);
        });

        ///table ping model
        BABYLON.SceneLoader.ImportMesh("", "./models/", "Untitled_.glb", scene, (meshes) => {
            // Model loaded successfully
            console.log("GLB Model loaded:", meshes);
            
            // Position the imported model
            if (meshes.length > 0) {
                const rootMesh = meshes[0];
                rootMesh.position = new BABYLON.Vector3(0, 0, 0);
                rootMesh.scaling = new BABYLON.Vector3(10, 10, 12); // Scale if needed
            }
        }, (progress) => {
            // Loading progress
            console.log("Loading progress:", progress);
        }, (error) => {
            console.log("Error loading GLB model:", error);
            // Fallback: create a simple box if model fails to load
            const fallbackBox = BABYLON.MeshBuilder.CreateBox("fallback", { size: 1 }, scene);
            fallbackBox.position = new BABYLON.Vector3(0, 0, 0);
        });

        //paddle ping model player 1
        BABYLON.SceneLoader.ImportMesh("", "./models/", "raqueta_de_ping_pong.glb", scene, (meshes) => {
            // Model loaded successfully
            console.log("GLB Model loaded:", meshes);
            
            // Position the imported model
            if (meshes.length > 0) {
                const rootMesh = meshes[0];
                rootMesh.position = new BABYLON.Vector3(60, 50, -28.5);
                rootMesh.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0); // Rotate if needed
                rootMesh.scaling = new BABYLON.Vector3(0.8, 0.8, 0.8); // Scale if needed
            }
        }, (progress) => {
            // Loading progress
            console.log("Loading progress:", progress);
        }, (error) => {
            console.log("Error loading GLB model:", error);
            // Fallback: create a simple box if model fails to load
            const fallbackBox = BABYLON.MeshBuilder.CreateBox("fallback", { size: 1 }, scene);
            fallbackBox.position = new BABYLON.Vector3(0, 0, 0);
        });


               //paddle ping model player 2
               BABYLON.SceneLoader.ImportMesh("", "./models/", "raqueta_de_ping_pong.glb", scene, (meshes) => {
                // Model loaded successfully
                console.log("GLB Model loaded:", meshes);
                
                // Position the imported model
                if (meshes.length > 0) {
                    const rootMesh = meshes[0];
                    rootMesh.position = new BABYLON.Vector3(-60, 50, -28.5);
                    rootMesh.rotation = new BABYLON.Vector3(0, -Math.PI/2 , 0); // Rotate if needed
                    rootMesh.scaling = new BABYLON.Vector3(0.8, 0.8, 0.8); // Scale if needed
                }
            }, (progress) => {
                // Loading progress
                console.log("Loading progress:", progress);
            }, (error) => {
                console.log("Error loading GLB model:", error);
                // Fallback: create a simple box if model fails to load
                const fallbackBox = BABYLON.MeshBuilder.CreateBox("fallback", { size: 1 }, scene);
                fallbackBox.position = new BABYLON.Vector3(0, 0, 0);
            });
    
    
      
        
      
        // Render loop
        engine.runRenderLoop(() => {
            if (scene) {
                scene.render();
            }
        });

       

  

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
                <h3 className="font-bold mb-2">Controls:</h3>
                <div className="text-sm">
                    <div>• Mouse: Rotate camera</div>
                    <div>• Wheel: Zoom in/out</div>
                    <div>• Click blue sphere to scale</div>
                    <div>• Hover red box to change color</div>
                </div>
            </div>
        </div>
    );
}
