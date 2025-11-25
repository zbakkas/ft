
"use client";

import { ChevronDown, ChevronUp, Filter, Trophy } from "lucide-react";
import { useState } from "react";





// Leaderboard screen with enhanced features
export default function Leaderboard() {
// Leaderboard filters
  const [leaderboardFilter, setLeaderboardFilter] = useState('all'); // all, friends, country
  const [leaderboardSort, setLeaderboardSort] = useState('rank'); // rank, wins, winRate
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const itemsPerPage = 10;
    const isLoggedIn = true; // Replace with actual authentication check
    const playerName = "Player1"; // Replace with actual player name
    const guestName = "Guest"; // Default guest name

// Extended leaderboard data with more players
const [allPlayers] = useState([
    { rank: 1, name: "ProGamer99", avatar: "🏆", wins: 156, totalGames: 200, winRate: 78, avgScore: 12.5, level: "Legend", country: "🇺🇸", online: true },
    { rank: 2, name: "SkyjoMaster", avatar: "⭐", wins: 134, totalGames: 180, winRate: 74, avgScore: 13.2, level: "Master", country: "🇬🇧", online: true },
    { rank: 3, name: "CardShark", avatar: "🦈", wins: 98, totalGames: 150, winRate: 65, avgScore: 15.1, level: "Expert", country: "🇩🇪", online: false },
    { rank: 4, name: "zbakkas", avatar: "👤", wins: 45, totalGames: 65, winRate: 69, avgScore: 16.8, level: "Pro", country: "🇫🇷", online: true },
    { rank: 5, name: "Alice2023", avatar: "😊", wins: 78, totalGames: 125, winRate: 62, avgScore: 17.3, level: "Advanced", country: "🇯🇵", online: true },
    { rank: 6, name: "BobTheBuilder", avatar: "🤠", wins: 67, totalGames: 110, winRate: 61, avgScore: 18.2, level: "Advanced", country: "🇨🇦", online: false },
    { rank: 7, name: "QuickWin", avatar: "⚡", wins: 52, totalGames: 90, winRate: 58, avgScore: 19.1, level: "Intermediate", country: "🇦🇺", online: true },
    { rank: 8, name: "LuckyPlayer", avatar: "🍀", wins: 41, totalGames: 75, winRate: 55, avgScore: 20.5, level: "Intermediate", country: "🇧🇷", online: true },
    { rank: 9, name: "GameNinja", avatar: "🥷", wins: 35, totalGames: 70, winRate: 50, avgScore: 21.8, level: "Beginner", country: "🇰🇷", online: false },
    { rank: 10, name: "Challenger", avatar: "🎯", wins: 28, totalGames: 60, winRate: 47, avgScore: 23.2, level: "Beginner", country: "🇮🇹", online: true },
    { rank: 11, name: "CardMaster", avatar: "🎴", wins: 92, totalGames: 140, winRate: 66, avgScore: 14.8, level: "Expert", country: "🇪🇸", online: true },
    { rank: 12, name: "FastPlayer", avatar: "💨", wins: 73, totalGames: 120, winRate: 61, avgScore: 18.9, level: "Advanced", country: "🇳🇱", online: false },
    { rank: 13, name: "StrategicMind", avatar: "🧠", wins: 64, totalGames: 95, winRate: 67, avgScore: 16.2, level: "Pro", country: "🇸🇪", online: true },
    { rank: 14, name: "RiskyPlayer", avatar: "🎲", wins: 39, totalGames: 80, winRate: 49, avgScore: 22.1, level: "Intermediate", country: "🇷🇺", online: true },
    { rank: 15, name: "CalmGamer", avatar: "😌", wins: 56, totalGames: 88, winRate: 64, avgScore: 17.6, level: "Advanced", country: "🇳🇴", online: false },
    { rank: 16, name: "FireStorm", avatar: "🔥", wins: 47, totalGames: 82, winRate: 57, avgScore: 19.8, level: "Intermediate", country: "🇲🇽", online: true },
    { rank: 17, name: "IceQueen", avatar: "❄️", wins: 61, totalGames: 98, winRate: 62, avgScore: 18.3, level: "Advanced", country: "🇫🇮", online: true },
    { rank: 18, name: "ThunderBolt", avatar: "⚡", wins: 33, totalGames: 65, winRate: 51, avgScore: 21.5, level: "Beginner", country: "🇦🇷", online: false },
    { rank: 19, name: "MysticCard", avatar: "🔮", wins: 29, totalGames: 58, winRate: 50, avgScore: 22.8, level: "Beginner", country: "🇮🇳", online: true },
    { rank: 20, name: "WildCard", avatar: "🃏", wins: 25, totalGames: 55, winRate: 45, avgScore: 24.1, level: "Beginner", country: "🇨🇳", online: true },
  ]);

    // Filter and sort leaderboard
    const getFilteredLeaderboard = () => {
        let filtered = [...allPlayers];
        
        // Apply filters
        if (leaderboardFilter === 'online') {
          filtered = filtered.filter(player => player.online);
        }
        
        // Apply sorting
        switch (leaderboardSort) {
          case 'wins':
            filtered.sort((a, b) => b.wins - a.wins);
            break;
          case 'winRate':
            filtered.sort((a, b) => b.winRate - a.winRate);
            break;
          case 'rank':
          default:
            filtered.sort((a, b) => a.rank - b.rank);
            break;
        }
        
        return filtered;
      };

    // Get paginated leaderboard
  const getPaginatedLeaderboard = () => {
    const filtered = getFilteredLeaderboard();
    const startIndex = (leaderboardPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      players: filtered.slice(startIndex, endIndex),
      totalPages: Math.ceil(filtered.length / itemsPerPage),
      totalPlayers: filtered.length
    };
  };
    // Get current player name (logged in or guest)
    const getCurrentPlayerName = () => {
        return isLoggedIn ? playerName : guestName;
      };
    
  // Get level color
  const getLevelColor = (level) => {
    switch (level) {
      case 'Legend': return 'from-purple-500 to-pink-500';
      case 'Master': return 'from-yellow-500 to-orange-500';
      case 'Expert': return 'from-red-500 to-pink-500';
      case 'Pro': return 'from-blue-500 to-cyan-500';
      case 'Advanced': return 'from-green-500 to-emerald-500';
      case 'Intermediate': return 'from-yellow-400 to-yellow-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };


    const { players: paginatedPlayers, totalPages, totalPlayers } = getPaginatedLeaderboard();
    
    return (
      <div className=" ">
        {/* <Navbar /> */}
        
        <div className="py-6 px-4">
          {/* Custom Scrollbar Styles */}
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
          `}</style>

          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-3 rounded-xl">
                    <Trophy size={32} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Global Leaderboard</h1>
                    <p className="text-blue-200">Top players worldwide • {totalPlayers.toLocaleString()} players online</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Controls */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-4 border border-white/20">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-blue-300" />
                    <span className="text-white text-sm font-medium">Filter:</span>
                    <select
                      value={leaderboardFilter}
                      onChange={(e) => {
                        setLeaderboardFilter(e.target.value);
                        setLeaderboardPage(1);
                      }}
                      className="bg-white/10 border border-white/30 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="all" className="bg-slate-800">All Players</option>
                      <option value="online" className="bg-slate-800">Online Only</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">Sort:</span>
                    <select
                      value={leaderboardSort}
                      onChange={(e) => {
                        setLeaderboardSort(e.target.value);
                        setLeaderboardPage(1);
                      }}
                      className="bg-white/10 border border-white/30 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="rank" className="bg-slate-800">By Rank</option>
                      <option value="wins" className="bg-slate-800">By Wins</option>
                      <option value="winRate" className="bg-slate-800">By Win Rate</option>
                    </select>
                  </div>
                </div>

                {/* Pagination */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLeaderboardPage(Math.max(1, leaderboardPage - 1))}
                    disabled={leaderboardPage === 1}
                    className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg transition-colors"
                  >
                    <ChevronUp size={16} className="text-white" />
                  </button>
                  
                  <span className="text-white text-sm px-3">
                    Page {leaderboardPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setLeaderboardPage(Math.min(totalPages, leaderboardPage + 1))}
                    disabled={leaderboardPage === totalPages}
                    className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg transition-colors"
                  >
                    <ChevronDown size={16} className="text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
              <div className="p-4 border-b border-white/20">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  🏅 Rankings
                  <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-xs">
                    Live
                  </span>
                </h2>
              </div>
              
              <div>
                {paginatedPlayers.map((player, index) => (
                  <div 
                    key={player.rank} 
                    className={`p-4 border-b border-white/10 transition-all duration-200 ${
                      player.name === getCurrentPlayerName() ? 'bg-blue-500/20 hover:bg-blue-500/30' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          player.rank === 1 ? 'bg-yellow-500 text-white' :
                          player.rank === 2 ? 'bg-gray-400 text-white' :
                          player.rank === 3 ? 'bg-amber-600 text-white' :
                          'bg-white/20 text-white'
                        }`}>
                          {player.rank <= 3 ? (
                            player.rank === 1 ? '🥇' : 
                            player.rank === 2 ? '🥈' : '🥉'
                          ) : `#${player.rank}`}
                        </div>
                        
                        {/* Avatar & Name */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-lg">
                            {player.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className={`font-semibold ${
                                player.name === getCurrentPlayerName() ? 'text-blue-300' : 'text-white'
                              }`}>
                                {player.name}
                                {player.name === getCurrentPlayerName() && (
                                  <span className="text-xs ml-1">(You)</span>
                                )}
                              </h3>
                              <span className="text-sm">{player.country}</span>
                              {player.online && (
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              )}
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getLevelColor(player.level)} text-white inline-block`}>
                              {player.level}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="text-right">
                        <div className="grid grid-cols-4 gap-6 text-sm">
                          <div>
                            <div className="text-white font-bold">{player.wins}</div>
                            <div className="text-blue-200 text-xs">Wins</div>
                          </div>
                          <div>
                            <div className="text-white font-bold">{player.totalGames}</div>
                            <div className="text-blue-200 text-xs">Games</div>
                          </div>
                          <div>
                            <div className="text-green-400 font-bold">{player.winRate}%</div>
                            <div className="text-blue-200 text-xs">Win Rate</div>
                          </div>
                          <div>
                            <div className="text-purple-400 font-bold">{player.avgScore}</div>
                            <div className="text-blue-200 text-xs">Avg Score</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  
}