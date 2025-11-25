"use client";

import { Crown, Users, Lock, Play, Unlock, X, LogOut, Settings, Grid, Target, Clock, Hash, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import {  useRouter } from "next/navigation";
import { useSocket } from '../contexts/SocketContext';
import Link from "next/link";
import { useEffect, useState } from "react";

const avatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Mittens&backgroundColor=d1d4f9",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Fluffy&backgroundColor=ffd93d",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Snickers&backgroundColor=ffb3ba",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Princess&backgroundColor=bae1ff",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Smokey&backgroundColor=caffbf",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Bandit&backgroundColor=a8dadc",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Oreo&backgroundColor=f1faee",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow&backgroundColor=e9c46a",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky&backgroundColor=f4a261",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Max&backgroundColor=e76f51",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Bella&backgroundColor=264653",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie&backgroundColor=2a9d8f",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&backgroundColor=457b9d",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Cooper&backgroundColor=1d3557",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Daisy&backgroundColor=f72585",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Rocky&backgroundColor=b5179e"
];

export default function JoinRoom() {
  const {room, startGame, name_player, leaveRoom, kickPlayer, joinGame,gameSettings,setGameSettings} = useSocket();
  const isHost = room?.ownirName === name_player;
  const router = useRouter();
  
  // Add state for settings
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    rows: 3,
    columns: 4,
    gameMode: "turns", // "turns" or "maxScore"
    turns: 8,
    maxScore: 100,
    firstHeadCards: 2,
    enableColumnRemoval: true,
    enableRowRemoval: false
  });

  const leaveRoom_ = () => {
    leaveRoom(room?.roomId!);
    // router.back();
  };

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    // Add your socket function to update room settings here
    // updateRoomSettings(room?.roomId, newSettings);
    setGameSettings(newSettings,room?.roomId!);
  };

  useEffect(() => {
    if (startGame) {
      router.push('/game');
    }
  }, [startGame]);

  return (
    <div>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center py-6 px-4">
        {/* Custom Scrollbar and Slider Styles */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #3b82f6, #1d4ed8);
            border-radius: 3px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #2563eb, #1e40af);
          }
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #3b82f6 rgba(255, 255, 255, 0.1);
          }

          /* Custom Slider Styles */
          .slider {
            -webkit-appearance: none;
            appearance: none;
            height: 8px;
            border-radius: 10px;
            outline: none;
            transition: all 0.3s ease;
          }

          .slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid white;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          }

          .slider::-webkit-slider-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
          }

          .slider::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid white;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          }

          .slider::-moz-range-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
          }

          .green-slider {
            background: linear-gradient(90deg, #10b981, #059669);
          }
          .green-slider::-webkit-slider-thumb {
            background: linear-gradient(135deg, #34d399, #10b981);
          }
          .green-slider::-moz-range-thumb {
            background: linear-gradient(135deg, #34d399, #10b981);
          }

          .yellow-slider {
            background: linear-gradient(90deg, #f59e0b, #d97706);
          }
          .yellow-slider::-webkit-slider-thumb {
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
          }
          .yellow-slider::-moz-range-thumb {
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
          }

          .purple-slider {
            background: linear-gradient(90deg, #8b5cf6, #7c3aed);
          }
          .purple-slider::-webkit-slider-thumb {
            background: linear-gradient(135deg, #a78bfa, #8b5cf6);
          }
          .purple-slider::-moz-range-thumb {
            background: linear-gradient(135deg, #a78bfa, #8b5cf6);
          }
        `}</style>

        <div className="max-w-4xl w-full">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded font-mono text-sm">
                    #{room?.roomId}
                  </span>
                  <h1 className="text-2xl font-bold text-white">{room?.room_name}</h1>
                </div>
                <div className="flex items-center gap-4 text-blue-200 text-sm">
                  <div className="flex items-center gap-1">
                    <Crown size={14} />
                    <span>Host: {room?.ownirName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>{room?.players.length}/{room?.max_players} Players</span>
                  </div>
                  {room?.password?.trim() ? (
                    <div className="flex items-center gap-1">
                      <Lock size={14} />
                      <span>Private</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Unlock size={14} />
                      <span>Public</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {isHost && (
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2"
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                )}
                
                <Link
                  onClick={leaveRoom_}
                  href="/"
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Leave Room
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Players Section */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Players</h2>
                
                <div className="max-h-80 overflow-y-auto custom-scrollbar mb-6">
                  <div className="space-y-2 pr-2">
                    {room?.players.map((player, index) => (
                      <div key={index} className="bg-white/10 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/10 border border-white/30 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all hover:scale-105 overflow-hidden">
                            <img 
                              src={room.avatars[index]} 
                              alt="Avatar" 
                              className="w-full h-full object-cover rounded-full"
                            />
                          </div>
                          <span className="text-white font-medium text-sm">{player}</span>
                          {player === room?.ownirName && (
                            <Crown size={14} className="text-yellow-400" />
                          )}
                          {player === name_player && (
                            <span className="text-blue-300 text-xs">(You)</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isHost && player !== room?.ownirName && (
                            <button
                              onClick={() => kickPlayer(player, room?.roomId!)}
                              className="bg-red-500/80 hover:bg-red-500 text-white p-1.5 rounded transition-colors"
                              title={`Kick ${player}`}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {Array.from({ length: room?.max_players - room?.players.length }).map((_, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-3 flex items-center gap-3 border-2 border-dashed border-white/20">
                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                          <Users size={16} className="text-white/50" />
                        </div>
                        <span className="text-white/50 text-sm">Waiting for player...</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* IMPROVED Game Settings Section with Sliders */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Game Settings</h2>
                
                {showSettings && isHost ? (
                  <div className="bg-white/5 rounded-lg border border-white/20 space-y-6 max-h-80 overflow-y-auto custom-scrollbar">
                    
                    {/* Grid Settings */}
                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-4 border border-green-500/20">
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <div className="bg-green-500/20 p-1.5 rounded-lg">
                          <Grid size={16} className="text-green-400" />
                        </div>
                        Grid Size
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-green-200 text-sm font-medium">Columns</label>
                            <span className="text-green-300 font-bold text-lg bg-green-500/20 px-2 py-1 rounded">{settings.columns}</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="4"
                            value={settings.columns}
                            onChange={(e) => updateSettings({...settings, columns: parseInt(e.target.value)})}
                            className="slider green-slider w-full"
                          />
                          <div className="flex justify-between text-xs text-green-300 mt-1">
                            <span>1</span>
                            <span>4</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-green-200 text-sm font-medium">Rows</label>
                            <span className="text-green-300 font-bold text-lg bg-green-500/20 px-2 py-1 rounded">{settings.rows}</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="4"
                            value={settings.rows}
                            onChange={(e) => updateSettings({...settings, rows: parseInt(e.target.value)})}
                            className="slider green-slider w-full"
                          />
                          <div className="flex justify-between text-xs text-green-300 mt-1">
                            <span>1</span>
                            <span>4</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Game Mode */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-4 border border-blue-500/20">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <div className="bg-blue-500/20 p-1.5 rounded-lg">
                          <Target size={16} className="text-blue-400" />
                        </div>
                        Game Mode
                      </h3>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                          <input
                            type="radio"
                            name="gameMode"
                            value="turns"
                            checked={settings.gameMode === "turns"}
                            onChange={(e) => updateSettings({...settings, gameMode: e.target.value})}
                            className="text-blue-500"
                          />
                          <Clock size={14} className="text-blue-300" />
                          <span className="text-white text-sm font-medium">Limited Turns</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                          <input
                            type="radio"
                            name="gameMode"
                            value="maxScore"
                            checked={settings.gameMode === "maxScore"}
                            onChange={(e) => updateSettings({...settings, gameMode: e.target.value})}
                            className="text-blue-500"
                          />
                          <Hash size={14} className="text-blue-300" />
                          <span className="text-white text-sm font-medium">Max Score</span>
                        </label>
                      </div>
                    </div>

                    {/* Turn/Score Settings */}
                    <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-xl p-4 border border-yellow-500/20">
                      {settings.gameMode === "turns" ? (
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-yellow-200 text-sm font-medium flex items-center gap-2">
                              <div className="bg-yellow-500/20 p-1 rounded">
                                <Clock size={12} className="text-yellow-400" />
                              </div>
                              Number of Turns
                            </label>
                            <span className="text-yellow-300 font-bold text-xl bg-yellow-500/20 px-3 py-1 rounded">{settings.turns}</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={settings.turns}
                            onChange={(e) => updateSettings({...settings, turns: parseInt(e.target.value)})}
                            className="slider yellow-slider w-full"
                          />
                          <div className="flex justify-between text-xs text-yellow-300 mt-1">
                            <span>1</span>
                            <span>10</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-yellow-200 text-sm font-medium flex items-center gap-2">
                              <div className="bg-yellow-500/20 p-1 rounded">
                                <Hash size={12} className="text-yellow-400" />
                              </div>
                              Max Score
                            </label>
                            <span className="text-yellow-300 font-bold text-xl bg-yellow-500/20 px-3 py-1 rounded">{settings.maxScore}</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="200"
                            step="10"
                            value={settings.maxScore}
                            onChange={(e) => updateSettings({...settings, maxScore: parseInt(e.target.value)})}
                            className="slider yellow-slider w-full"
                          />
                          <div className="flex justify-between text-xs text-yellow-300 mt-1">
                            <span>50</span>
                            <span>200</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* First Head Cards */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-4 border border-purple-500/20">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-purple-200 text-sm font-medium flex items-center gap-2">
                          <div className="bg-purple-500/20 p-1 rounded">
                            <CreditCard size={12} className="text-purple-400" />
                          </div>
                          First Head Cards
                        </label>
                        <span className="text-purple-300 font-bold text-xl bg-purple-500/20 px-3 py-1 rounded">{settings.firstHeadCards}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={settings.rows * settings.columns }
                        value={settings.firstHeadCards}
                        onChange={(e) => updateSettings({...settings, firstHeadCards: parseInt(e.target.value)})}
                        className="slider purple-slider w-full"
                      />
                      <div className="flex justify-between text-xs text-purple-300 mt-1">
                        <span>0</span>
                        <span>{settings.rows * settings.columns }</span>
                      </div>
                    </div>

                    {/* Removal Options */}
                    <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl p-4 border border-red-500/20">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <div className="bg-red-500/20 p-1.5 rounded-lg">
                          <Target size={16} className="text-red-400" />
                        </div>
                        Removal Options
                      </h3>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                          <input
                            type="checkbox"
                            checked={settings.enableColumnRemoval}
                            onChange={(e) => updateSettings({...settings, enableColumnRemoval: e.target.checked})}
                            className="text-red-500 rounded"
                          />
                          <span className="text-white text-sm font-medium">Enable Column Removal</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                          <input
                            type="checkbox"
                            checked={settings.enableRowRemoval}
                            onChange={(e) => updateSettings({...settings, enableRowRemoval: e.target.checked})}
                            className="text-red-500 rounded"
                          />
                          <span className="text-white text-sm font-medium">Enable Row Removal</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Display current settings (read-only for non-hosts)
                  <div className="bg-white/5 rounded-lg p-4 space-y-4 border border-white/20">
                    <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-200 text-sm flex items-center gap-2 font-medium">
                          <Grid size={14} className="text-green-400" />
                          Grid Size
                        </span>
                        <span className="text-white text-sm font-bold">{room?.gameSettings.columns} × {room?.gameSettings.rows}</span>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-200 text-sm flex items-center gap-2 font-medium">
                          <Target size={14} className="text-blue-400" />
                          Game Mode
                        </span>
                        <span className="text-white text-sm font-bold">
                          {room?.gameSettings.gameMode === "turns" 
                            ? `${room?.gameSettings.turns} Turns` 
                            : `Max Score: ${room?.gameSettings.maxScore}`
                          }
                        </span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-200 text-sm flex items-center gap-2 font-medium">
                          <CreditCard size={14} className="text-purple-400" />
                          First Head Cards
                        </span>
                        <span className="text-white text-sm font-bold">{room?.gameSettings.firstHeadCards}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-lg p-3 border border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-200 text-sm font-medium">Column Removal</span>
                          <span className={`text-sm font-bold ${room?.gameSettings.enableColumnRemoval ? 'text-green-400' : 'text-red-400'}`}>
                            {room?.gameSettings.enableColumnRemoval ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-lg p-3 border border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-200 text-sm font-medium">Row Removal</span>
                          <span className={`text-sm font-bold ${room?.gameSettings.enableRowRemoval ? 'text-green-400' : 'text-red-400'}`}>
                            {room?.gameSettings.enableRowRemoval ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Start Game Button */}
            <div className="mt-6">
              {isHost ? (
                <div>
                  <button
                    onClick={() => joinGame(room.roomId)}
                    disabled={room?.players.length < 2}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Play size={18} />
                    Start Game
                  </button>
                  {room?.players.length < 2 && (
                    <p className="text-yellow-300 text-sm mt-2 text-center">
                      Need at least 2 players to start
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-blue-200 text-sm">Waiting for host to start the game...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}