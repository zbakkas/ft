"use client";

import { Activity, Calendar, Clock, Crown, Target, TrendingUp, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useSocket } from "../contexts/SocketContext";

interface PlayerStats {
  playerId: string;
  username: string;
  avatar: string;
  totalGames: number;
  wins: number;
  winRate: number;
  totalPlayTime: number;
  bestScore: number | null;
  averageScore: number;
  currentStreak: number;
  bestStreak: number;
}

interface GameHistory {
  id: number;
  roomId: string;
  roomName: string;
  date: string;
  time: string;
  duration: string;
  players: string[];
  winner: string;
  position: number;
  finalScore: number;
}

interface Opponent {
  name: string;
  avatar: string;
  count: number;
}

const API_BASE_URL = 'http://localhost:3000/api/v1/skyjo';

export default function Dashboard() {
  const { playerID } = useSocket();
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log playerID
  useEffect(() => {
    console.log('Dashboard playerID:', playerID);
  }, [playerID]);

  // Fetch player data
  useEffect(() => {
    if (!playerID) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [statsRes, historyRes, opponentsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/player/${playerID}/stats`, { credentials: 'include' }).catch((e) => { console.error('Stats fetch error:', e); return null; }),
          fetch(`${API_BASE_URL}/player/${playerID}/history?limit=20`, { credentials: 'include' }).catch((e) => { console.error('History fetch error:', e); return null; }),
          fetch(`${API_BASE_URL}/player/${playerID}/opponents?limit=5`, { credentials: 'include' }).catch((e) => { console.error('Opponents fetch error:', e); return null; }),
        ]);

        if (statsRes?.ok) {
          const stats = await statsRes.json();
          setPlayerStats(stats);
        }

        if (historyRes?.ok) {
          const history = await historyRes.json();
          setGameHistory(history);
        }

        if (opponentsRes?.ok) {
          const opps = await opponentsRes.json();
          setOpponents(opps);
        }

        if (!statsRes && !historyRes && !opponentsRes) {
          setError('Unable to connect to server.');
        } 
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [playerID]);

  // Format play time
  const formatPlayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Default stats for new players
  const stats = playerStats || {
    totalGames: 0,
    wins: 0,
    winRate: 0,
    totalPlayTime: 0,
    bestScore: null,
    averageScore: 0,
    currentStreak: 0,
    bestStreak: 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black flex flex-col items-center justify-center p-4">
         <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-16 h-16">
               <div className="absolute top-0 left-0 w-full h-full border-4 border-cyan-500/30 rounded-full"></div>
               <div className="absolute top-0 left-0 w-full h-full border-4 border-t-cyan-400 rounded-full animate-spin"></div>
            </div>
            <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase">Loading Stats...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black font-mono relative overflow-hidden py-8 px-4">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)',
            backgroundSize: '40px 40px'
      }}></div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #06b6d4; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0891b2; }
      `}</style>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
           <div>
              <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter mb-1">
                 PLAYER STATISTICS
              </h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                 Performance Overview & History
              </p>
           </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6 text-center">
            <p className="text-red-300 font-bold">{error}</p>
          </div>
        )}

        {/* Stats Cards Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* Wins Card - Green */}
          <div className="bg-gray-900/60 backdrop-blur-md rounded-xl p-5 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)] group hover:border-green-500/50 transition-all duration-300">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20 group-hover:scale-110 transition-transform">
                <Trophy size={24} className="text-green-400" />
              </div>
              <div>
                <p className="text-4xl font-black text-white">{stats.wins}</p>
                <p className="text-green-400/70 text-xs font-bold uppercase tracking-wider">Total Wins</p>
              </div>
            </div>
            <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
               <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.winRate}%` }}></div>
            </div>
            <div className="mt-2 text-right text-xs text-gray-400">
               <span className="text-white font-bold">{stats.winRate}%</span> Win Rate
            </div>
          </div>

          {/* Games Card - Cyan */}
          <div className="bg-gray-900/60 backdrop-blur-md rounded-xl p-5 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] group hover:border-cyan-500/50 transition-all duration-300">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-cyan-500/10 p-3 rounded-lg border border-cyan-500/20 group-hover:scale-110 transition-transform">
                <Activity size={24} className="text-cyan-400" />
              </div>
              <div>
                <p className="text-4xl font-black text-white">{stats.totalGames}</p>
                <p className="text-cyan-400/70 text-xs font-bold uppercase tracking-wider">Games Played</p>
              </div>
            </div>
             <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 border-t border-white/5 pt-2">
                <Clock size={12} />
                <span>Playtime: <span className="text-white font-bold">{formatPlayTime(stats.totalPlayTime)}</span></span>
             </div>
          </div>

          {/* Best Score - Purple */}
          <div className="bg-gray-900/60 backdrop-blur-md rounded-xl p-5 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)] group hover:border-purple-500/50 transition-all duration-300">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/20 group-hover:scale-110 transition-transform">
                <Target size={24} className="text-purple-400" />
              </div>
              <div>
                <p className="text-4xl font-black text-white">{stats.bestScore ?? '-'}</p>
                <p className="text-purple-400/70 text-xs font-bold uppercase tracking-wider">Best Score</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 border-t border-white/5 pt-2">
                <span>Average: <span className="text-white font-bold">{stats.averageScore}</span> pts</span>
             </div>
          </div>

          {/* Streak - Orange */}
          <div className="bg-gray-900/60 backdrop-blur-md rounded-xl p-5 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)] group hover:border-orange-500/50 transition-all duration-300">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-orange-500/10 p-3 rounded-lg border border-orange-500/20 group-hover:scale-110 transition-transform">
                <TrendingUp size={24} className="text-orange-400" />
              </div>
              <div>
                <p className="text-4xl font-black text-white">{stats.currentStreak}</p>
                <p className="text-orange-400/70 text-xs font-bold uppercase tracking-wider">Current Streak</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 border-t border-white/5 pt-2">
               <span>Best Streak: <span className="text-white font-bold">{stats.bestStreak}</span></span>
               <span className="text-orange-400 ml-auto font-bold">{stats.currentStreak > 0 ? 'ON FIRE!' : ''}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Game History */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/60 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-white/10 bg-black/20 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="text-cyan-400" size={20} />
                  MATCH HISTORY
                </h2>
                <span className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-xs font-bold border border-cyan-500/30">
                  {gameHistory.length} Matches
                </span>
              </div>
              
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-2">
                {gameHistory.length > 0 ? (
                  gameHistory.map(game => (
                    <div key={game.id} className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 rounded-xl p-4 mb-2 transition-all duration-200">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-black/40 text-gray-400 border border-white/10 px-2 py-0.5 rounded text-[10px] font-mono">
                              ID: {game.roomId}
                            </span>
                            <h3 className="text-white font-bold text-sm">{game.roomName}</h3>
                            {game.position === 1 && (
                              <Crown size={14} className="text-yellow-400 animate-pulse" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-gray-400 text-xs mb-3">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-purple-400" />
                              <span>{game.date}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} className="text-blue-400" />
                              <span>{game.time}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Activity size={12} className="text-green-400" />
                              <span>{game.duration}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {game.players.map((player, index) => (
                              <div 
                                key={index} 
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  player === playerStats?.username 
                                    ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' 
                                    : 'bg-black/30 text-gray-400 border-white/5'
                                }`}
                              >
                                {player}
                                {player === game.winner && ' 👑'}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="text-right min-w-[80px]">
                          <div className={`inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-2 ${
                            game.position === 1 
                              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' 
                              : game.position === 2
                              ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}>
                            {game.position === 1 ? '1st Place' : `${game.position}th Place`}
                          </div>
                          <div className="text-2xl font-black text-white">
                            {game.finalScore} <span className="text-xs font-normal text-gray-400">pts</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="inline-block p-4 rounded-full bg-white/5 mb-4">
                       <Activity size={32} className="text-cyan-400/50" />
                    </div>
                    <p className="text-gray-300 font-bold">No games played yet</p>
                    <p className="text-gray-500 text-xs mt-1 uppercase tracking-wide">Jump into a lobby to start your journey!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Panel (Opponents) */}
          <div className="space-y-6">
            <div className="bg-gray-900/60 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Users size={16} className="text-purple-400" />
                Frequent Rivals
              </h3>
              
              <div className="space-y-3">
                {opponents.length > 0 ? (
                  opponents.map((opponent, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-black/20 hover:bg-white/5 rounded-xl border border-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        {opponent.avatar ? (
                          <div className="relative">
                             <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-50 blur-[2px]"></div>
                             <img 
                               src={opponent.avatar} 
                               alt={opponent.name}
                               className="relative w-8 h-8 rounded-full object-cover border border-white/10"
                               onError={(e) => {
                                 (e.target as HTMLImageElement).style.display = 'none';
                                 (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                               }}
                             />
                          </div>
                        ) : null}
                        <div className={`w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-white font-bold text-xs border border-white/10 ${opponent.avatar ? 'hidden' : ''}`}>
                          {opponent.name[0].toUpperCase()}
                        </div>
                        <span className="text-gray-200 font-bold text-sm">{opponent.name}</span>
                      </div>
                      <span className="text-purple-300 text-xs font-mono bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
                         {opponent.count} G
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 px-4 bg-white/5 rounded-xl border border-dashed border-white/10">
                    <p className="text-gray-400 text-xs">
                      Play more games to reveal your rivals!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}