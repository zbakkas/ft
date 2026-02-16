"use client";

import { Crown, Users, Lock, Play, Unlock, X, LogOut, Settings, Grid, Target, Clock, Hash, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSocket } from '../contexts/SocketContext';
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchUserProfile } from '../utils/fetchUserProfile';
import { useLang } from "@/app/context/LangContext";

export default function JoinRoom() {
  const { lang } = useLang()!;
  const {room, startGame, playerID, leaveRoom, kickPlayer, joinGame, gameSettings, setGameSettings} = useSocket();
  const router = useRouter();
  
  const [name_player, setNamePlayer] = useState('');
  
  useEffect(() => {
    if (playerID) {
      fetchUserProfile(playerID).then((profile) => {
        setNamePlayer(profile.username);
      });
    }
  }, [playerID]);

  const isHost = room?.ownirName === name_player;
  
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    rows: 3,
    columns: 4,
    gameMode: "turns",
    turns: 8,
    maxScore: 100,
    firstHeadCards: 2,
    enableColumnRemoval: true,
    enableRowRemoval: false
  });

  const leaveRoom_ = () => {
    leaveRoom(room?.roomId!);
    router.push('/skyjo');
  };

  const updateSettings = (newSettings: any) => {
    setSettings(newSettings);
    setGameSettings(newSettings, room?.roomId!);
  };

  useEffect(() => {
    if (startGame) {
      router.push('/skyjo/game');
    }
  }, [startGame]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black font-mono relative overflow-hidden flex items-center justify-center py-6 px-4">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)',
            backgroundSize: '40px 40px'
      }}></div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #06b6d4; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0891b2; }

        .slider { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 10px; outline: none; transition: all 0.3s ease; }
        .slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; cursor: pointer; transition: all 0.3s ease; border: 2px solid #000; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
        .slider::-webkit-slider-thumb:hover { transform: scale(1.1); }
        
        .cyan-slider { background: linear-gradient(90deg, #06b6d4, #0891b2); }
        .cyan-slider::-webkit-slider-thumb { background: #22d3ee; box-shadow: 0 0 10px #22d3ee; }

        .purple-slider { background: linear-gradient(90deg, #9333ea, #7e22ce); }
        .purple-slider::-webkit-slider-thumb { background: #c084fc; box-shadow: 0 0 10px #c084fc; }

        .yellow-slider { background: linear-gradient(90deg, #eab308, #ca8a04); }
        .yellow-slider::-webkit-slider-thumb { background: #facc15; box-shadow: 0 0 10px #facc15; }
      `}</style>

      <div className="relative z-10 max-w-5xl w-full">
        <div className="bg-gray-900/60 backdrop-blur-md rounded-2xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
          
          {/* Top Glow Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400"></div>

          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-white/5 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded text-xs font-bold tracking-widest">
                  #{room?.roomId}
                </span>
                <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                  {room?.room_name}
                </h1>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Crown size={14} />
                  <span className="font-bold">{room?.ownirName}</span>
                </div>
                <div className="flex items-center gap-2 text-cyan-400">
                  <Users size={14} />
                  <span>{room?.players.length} / {room?.max_players} Players</span>
                </div>
                <div className="flex items-center gap-2 text-purple-400">
                  {room?.password?.trim() ? <Lock size={14} /> : <Unlock size={14} />}
                  <span>{room?.password?.trim() ? 'Private' : 'Public'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              {isHost && (
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
                    showSettings 
                    ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                    : 'bg-gray-800 text-purple-400 hover:bg-gray-700'
                  }`}
                >
                  {lang === "eng" ? "Settings" : "Paramètres"}
                </button>
              )}
              
              <button
                onClick={leaveRoom_}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/50 rounded-lg font-bold text-xs uppercase tracking-widest transition-all"
              >
                <LogOut size={14} />
                {lang === "eng" ? "Leave" : "Partir"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Players Column */}
            <div className="bg-black/20 rounded-xl p-1 border border-white/5">
              <div className="bg-gray-900/50 rounded-lg p-4 h-full">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Users size={16} /> {lang === "eng" ? "Players Lobby" : "Salle des Joueurs"}
                </h2>
                
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                  {room?.players.map((player, index) => (
                    <div key={index} className="group bg-gray-800/50 hover:bg-gray-800 border border-white/5 hover:border-cyan-500/30 rounded-lg p-3 flex items-center justify-between transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                           <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 blur transition duration-300"></div>
                           <div className="relative w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center overflow-hidden border border-gray-600 group-hover:border-transparent">
                              <img src={room.avatars[index]} alt="Avatar" className="w-full h-full object-cover" />
                           </div>
                        </div>
                        <div>
                           <div className="flex items-center gap-2">
                              <span className="text-white font-bold text-sm">{player}</span>
                              {player === room?.ownirName && <Crown size={12} className="text-yellow-400" />}
                           </div>
                           {player === name_player && <span className="text-cyan-500 text-[10px] font-bold uppercase tracking-wider">YOU</span>}
                        </div>
                      </div>
                      
                      {isHost && player !== room?.ownirName && (
                        <button
                          onClick={() => kickPlayer(player, room?.roomId!)}
                          className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded transition-all"
                          title="Kick Player"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {Array.from({ length: room?.max_players - room?.players.length }).map((_, index) => (
                    <div key={index} className="border border-dashed border-gray-700 bg-black/10 rounded-lg p-4 flex items-center justify-center gap-3 opacity-50">
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                      <span className="text-gray-500 text-xs uppercase tracking-widest">{lang === "eng" ? "Waiting for player..." : "En attente du joueur..."}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Settings Column */}
            <div className="bg-black/20 rounded-xl p-1 border border-white/5 flex flex-col">
              <div className="bg-gray-900/50 rounded-lg p-4 h-full flex flex-col">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Settings size={16} /> {lang === "eng" ? "Game Configuration" : "Configuration du Jeu"}
                </h2>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  {showSettings && isHost ? (
                    <div className="space-y-4">
                      
                      {/* Grid Size */}
                      <div className="bg-gray-800/30 rounded-lg p-4 border border-cyan-500/10">
                        <h3 className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Grid size={14} /> {lang === "eng" ? "Grid Size" : "Taille de la Grille"}
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                             <div className="flex justify-between text-xs text-gray-400 mb-2">
                               <span>{lang === "eng" ? "Columns" : "Colonnes"}</span> <span className="text-white font-bold">{settings.columns}</span>
                             </div>
                             <input type="range" min="1" max="4" value={settings.columns} onChange={(e) => updateSettings({...settings, columns: parseInt(e.target.value)})} className="slider cyan-slider w-full" />
                          </div>
                          <div>
                             <div className="flex justify-between text-xs text-gray-400 mb-2">
                               <span>{lang === "eng" ? "Rows" : "Rangées"}</span> <span className="text-white font-bold">{settings.rows}</span>
                             </div>
                             <input type="range" min="1" max="4" value={settings.rows} onChange={(e) => updateSettings({...settings, rows: parseInt(e.target.value)})} className="slider cyan-slider w-full" />
                          </div>
                        </div>
                      </div>

                      {/* Game Mode */}
                      <div className="bg-gray-800/30 rounded-lg p-4 border border-purple-500/10">
                        <h3 className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Target size={14} /> {lang === "eng" ? "Game Mode" : "Mode de Jeu"}
                        </h3>
                        <div className="flex gap-2 mb-4">
                           {['turns', 'maxScore'].map((mode) => (
                             <button
                               key={mode}
                               onClick={() => updateSettings({...settings, gameMode: mode})}
                               className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                                 settings.gameMode === mode 
                                 ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                                 : 'bg-black/40 text-gray-500 hover:text-gray-300'
                               }`}
                             >
                               {mode === 'turns' ? (lang === "eng" ? "Turns" : "Tours") : (lang === "eng" ? "Score" : "Score")}
                             </button>
                           ))}
                        </div>

                        {settings.gameMode === "turns" ? (
                           <div>
                              <div className="flex justify-between text-xs text-gray-400 mb-2">
                                <span>{lang === "eng" ? "Total Turns" : "Tours Totaux"}</span> <span className="text-white font-bold">{settings.turns}</span>
                              </div>
                              <input type="range" min="1" max="10" value={settings.turns} onChange={(e) => updateSettings({...settings, turns: parseInt(e.target.value)})} className="slider purple-slider w-full" />
                           </div>
                        ) : (
                           <div>
                              <div className="flex justify-between text-xs text-gray-400 mb-2">
                                <span>{lang === "eng" ? "Target Score" : "Score Cible"}</span> <span className="text-white font-bold">{settings.maxScore}</span>
                              </div>
                              <input type="range" min="50" max="200" step="10" value={settings.maxScore} onChange={(e) => updateSettings({...settings, maxScore: parseInt(e.target.value)})} className="slider purple-slider w-full" />
                           </div>
                        )}
                      </div>

                      {/* Other Settings */}
                      <div className="bg-gray-800/30 rounded-lg p-4 border border-yellow-500/10 space-y-4">
                         <div>
                            <div className="flex justify-between text-xs text-yellow-500/80 uppercase font-bold tracking-wider mb-2">
                               {lang === "eng" ? "First Head Cards" : "Premières Cartes Révélées"} <span className="text-white">{settings.firstHeadCards}</span>
                            </div>
                            <input type="range" min="0" max={settings.rows * settings.columns} value={settings.firstHeadCards} onChange={(e) => updateSettings({...settings, firstHeadCards: parseInt(e.target.value)})} className="slider yellow-slider w-full" />
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                            <label className={`cursor-pointer p-2 rounded border transition-all ${settings.enableColumnRemoval ? 'bg-green-500/20 border-green-500/50' : 'bg-black/20 border-transparent'}`}>
                               <div className="flex items-center gap-2">
                                  <input type="checkbox" checked={settings.enableColumnRemoval} onChange={(e) => updateSettings({...settings, enableColumnRemoval: e.target.checked})} className="accent-green-500" />
                                  <span className="text-xs text-gray-300 font-bold">{lang === "eng" ? "Col Removal" : "Suppr. Col"}</span>
                               </div>
                            </label>
                            <label className={`cursor-pointer p-2 rounded border transition-all ${settings.enableRowRemoval ? 'bg-green-500/20 border-green-500/50' : 'bg-black/20 border-transparent'}`}>
                               <div className="flex items-center gap-2">
                                  <input type="checkbox" checked={settings.enableRowRemoval} onChange={(e) => updateSettings({...settings, enableRowRemoval: e.target.checked})} className="accent-green-500" />
                                  <span className="text-xs text-gray-300 font-bold">{lang === "eng" ? "Row Removal" : "Suppr. Rang"}</span>
                               </div>
                            </label>
                         </div>
                      </div>

                    </div>
                  ) : (
                    // Read Only View
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-black/30 p-3 rounded-lg flex justify-between items-center border border-white/5">
                        <span className="text-gray-400 text-xs uppercase font-bold tracking-wider flex items-center gap-2"><Grid size={14} className="text-cyan-500" /> {lang === "eng" ? "Grid" : "Grille"}</span>
                        <span className="text-white font-mono text-sm">{room?.gameSettings.columns} x {room?.gameSettings.rows}</span>
                      </div>
                      <div className="bg-black/30 p-3 rounded-lg flex justify-between items-center border border-white/5">
                        <span className="text-gray-400 text-xs uppercase font-bold tracking-wider flex items-center gap-2"><Target size={14} className="text-purple-500" /> {lang === "eng" ? "Mode" : "Mode"}</span>
                        <span className="text-white font-mono text-sm">
                          {room?.gameSettings.gameMode === "turns" ? `${room?.gameSettings.turns} ${lang === "eng" ? "Turns" : "Tours"}` : `${lang === "eng" ? "Score" : "Score"}: ${room?.gameSettings.maxScore}`}
                        </span>
                      </div>
                      <div className="bg-black/30 p-3 rounded-lg flex justify-between items-center border border-white/5">
                        <span className="text-gray-400 text-xs uppercase font-bold tracking-wider flex items-center gap-2"><CreditCard size={14} className="text-yellow-500" /> {lang === "eng" ? "Head Cards" : "Cartes Révélées"}</span>
                        <span className="text-white font-mono text-sm">{room?.gameSettings.firstHeadCards}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <div className={`p-2 rounded text-center text-xs font-bold border ${room?.gameSettings.enableColumnRemoval ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                            {lang === "eng" ? "Col Removal" : "Suppr. Col"}
                         </div>
                         <div className={`p-2 rounded text-center text-xs font-bold border ${room?.gameSettings.enableRowRemoval ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                            {lang === "eng" ? "Row Removal" : "Suppr. Rang"}
                         </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Start Button Area */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  {isHost ? (
                    <div>
                      <button
                        onClick={() => joinGame(room.roomId)}
                        disabled={room?.players.length < 2 || room?.status === 'playing'}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black uppercase tracking-widest py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Play size={18} fill="currentColor" />
                        {room?.status === 'playing' ? (lang === "eng" ? "Starting..." : "Démarrage...") : (lang === "eng" ? "Start Game" : "Démarrer le Jeu")}
                      </button>
                      {room?.players.length < 2 && (
                        <p className="text-yellow-400/80 text-xs mt-2 text-center font-bold uppercase tracking-wider">
                          ⚠ {lang === "eng" ? "Waiting for at least 2 players" : "En attente d'au moins 2 joueurs"}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                       <div className="inline-block animate-pulse w-2 h-2 bg-cyan-500 rounded-full mr-2"></div>
                       <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{lang === "eng" ? "Waiting for host to start..." : "En attente du démarrage du serveur..."}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}