"use client";
import Link from 'next/link';
import MultiplayerPongGame_2D from './game2d/test2';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-8">Game Hub</h1>
        <p className="text-xl text-gray-300 mb-12">Choose your game mode</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <a 
            href="/game2d"
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-6 px-8 rounded-lg transform transition hover:scale-105 shadow-lg block text-center"
          >
            <div className="text-2xl mb-2">🏓</div>
            <div>Multiplayer Pong</div>
          </a>
          
          <a 
            href="/game3d"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-6 px-8 rounded-lg transform transition hover:scale-105 shadow-lg block text-center"
          >
            <div className="text-2xl mb-2">🎮</div>
            <div>3D Game</div>
          </a>
          
          <a 
            href="/offline"
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-6 px-8 rounded-lg transform transition hover:scale-105 shadow-lg block text-center"
          >
            <div className="text-2xl mb-2">🤖</div>
            <div>Offline Game</div>
          </a>
          
          <a 
            href="/game2vs2"
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-6 px-8 rounded-lg transform transition hover:scale-105 shadow-lg block text-center"
          >
            <div className="text-2xl mb-2">👥</div>
            <div>2 vs 2 Game</div>
          </a>
        </div>
      </div>
    </div>

    // <>
    //   <MultiplayerPongGame_2D/>
    // </>
  );
}