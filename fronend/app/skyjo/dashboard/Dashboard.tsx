"use client";

import { Activity, ArrowLeft, Award, BarChart3, Calendar, Clock, Crown, Medal, Star, Target, TrendingUp, Trophy, Users } from "lucide-react";

export default function Dashboard() {
    const playerStats = {
        wins: 12,
        totalGames: 25,
        totalPlayTime: 1500, // in seconds
        bestScore: 8,
        averageScore: 10.5,
        recentStreak: 3,
        winRate: 48,
        favoriteOpponents: [
            { name: 'Alice', count: 5 },
            { name: 'Bob', count: 3 },
            { name: 'Charlie', count: 2 }
        ]};

    const gameHistory = [
        {
            id: 1,
            roomId: '1234',
            roomName: 'Skyjo Room 1',
            date: '2023-10-01',
            time: '14:30',
            duration: '30 mins',
            players: ['Alice', 'Bob', 'Charlie'],
            winner: 'Alice',
            position: 1,
            finalScore: 15
        },
        {
            id: 2,
            roomId: '5678',
            roomName: 'Skyjo Room 2',
            date: '2023-10-02',
            time: '15:00',
            duration: '25 mins',
            players: ['Alice', 'Bob', 'David'],
            winner: 'Bob',
            position: 2,
            finalScore: 12
        },
        {
            id: 3,
            roomId: '9101',
            roomName: 'Skyjo Room 3',
            date: '2023-10-03',
            time: '16:00',
            duration: '20 mins',
            players: ['Alice', 'Charlie', 'Eve'],
            winner: 'Alice',
            position: 1,
            finalScore: 10
        },
        {
            id: 4,
            roomId: '1121',
            roomName: 'Skyjo Room 4',
            date: '2023-10-04',
            time: '17:00',
            duration: '35 mins',
            players: ['Alice', 'Bob', 'Charlie', 'David'],
            winner: 'Charlie',
            position: 3,
            finalScore: 20
        },
        {
            id: 5,
            roomId: '3141',
            roomName: 'Skyjo Room 5',
            date: '2023-10-05',
            time: '18:00',
            duration: '40 mins',
            players: ['Alice', 'Bob', 'Eve'],
            winner: 'Alice',
            position: 1,
            finalScore: 18
        }
    ];
    const playerName = 'Alice'; // Example player name

      // Format play time
  const formatPlayTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };



  // Format time
  const formatTime = (timeString) => {
    return timeString.split(' ')[1].substring(0, 5);
  };
     // Dashboard screen

    return (
      <div className="  py-6 px-4">
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

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/20">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg">
                  <BarChart3 size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                  <p className="text-blue-200 text-sm">Your gaming statistics and history</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <Trophy size={20} className="text-green-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-xl">{playerStats.wins}</p>
                  <p className="text-blue-200 text-sm">Total Wins</p>
                </div>
              </div>
              <div className="text-green-400 text-xs">
                {playerStats.winRate}% win rate
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <Activity size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-xl">{playerStats.totalGames}</p>
                  <p className="text-blue-200 text-sm">Games Played</p>
                </div>
              </div>
              <div className="text-blue-400 text-xs">
                {formatPlayTime(playerStats.totalPlayTime)} total
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-purple-500/20 p-2 rounded-lg">
                  <Target size={20} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-xl">{playerStats.bestScore}</p>
                  <p className="text-blue-200 text-sm">Best Score</p>
                </div>
              </div>
              <div className="text-purple-400 text-xs">
                Avg: {playerStats.averageScore}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-orange-500/20 p-2 rounded-lg">
                  <TrendingUp size={20} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-xl">{playerStats.recentStreak}</p>
                  <p className="text-blue-200 text-sm">Current Streak</p>
                </div>
              </div>
              <div className="text-orange-400 text-xs">
                {playerStats.recentStreak > 0 ? 'Winning!' : 'Keep going!'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Game History */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
                <div className="p-4 border-b border-white/20">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar size={20} />
                    Recent Games
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs">
                      {gameHistory.length}
                    </span>
                  </h2>
                </div>
                
                <div className="max-h-120 overflow-y-auto custom-scrollbar">
                  {gameHistory.map(game => (
                    <div key={game.id} className="p-4 border-b border-white/10 hover:bg-white/5 transition-all duration-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded font-mono text-xs">
                              #{game.roomId}
                            </span>
                            <h3 className="text-white font-semibold text-sm">{game.roomName}</h3>
                            {game.winner === playerName && (
                              <Crown size={12} className="text-yellow-400" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 text-blue-200 text-xs mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar size={10} />
                              <span>{game.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={10} />
                              <span>{formatTime(`${game.date} ${game.time}`)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Activity size={10} />
                              <span>{game.duration}</span>
                            </div>
                          </div>

                          <div className="flex gap-1 flex-wrap mb-2">
                            {game.players.map((player, index) => (
                              <div 
                                key={index} 
                                className={`px-2 py-0.5 rounded text-xs ${
                                  player === playerName 
                                    ? 'bg-blue-500/20 text-blue-300' 
                                    : 'bg-white/10 text-white'
                                }`}
                              >
                                {player}
                                {player === game.winner && ' 👑'}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold mb-1 ${
                            game.position === 1 
                              ? 'bg-green-500/20 text-green-300' 
                              : game.position === 2
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}>
                            #{game.position}
                          </div>
                          <div className="text-white text-sm font-bold">
                            {game.finalScore} pts
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Achievements */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Award size={20} />
                  Achievements
                </h3>
                
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${playerStats.wins >= 5 ? 'bg-green-500/20' : 'bg-white/5'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Medal size={16} className={playerStats.wins >= 5 ? 'text-green-400' : 'text-gray-400'} />
                      <span className={`text-sm font-semibold ${playerStats.wins >= 5 ? 'text-green-300' : 'text-gray-400'}`}>
                        Winner
                      </span>
                    </div>
                    <p className="text-xs text-blue-200">Win 5 games ({playerStats.wins}/5)</p>
                  </div>

                  <div className={`p-3 rounded-lg ${playerStats.bestScore <= 10 ? 'bg-purple-500/20' : 'bg-white/5'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Star size={16} className={playerStats.bestScore <= 10 ? 'text-purple-400' : 'text-gray-400'} />
                      <span className={`text-sm font-semibold ${playerStats.bestScore <= 10 ? 'text-purple-300' : 'text-gray-400'}`}>
                        Perfect Game
                      </span>
                    </div>
                    <p className="text-xs text-blue-200">Score 10 or less (Best: {playerStats.bestScore})</p>
                  </div>

                  <div className={`p-3 rounded-lg ${playerStats.totalGames >= 10 ? 'bg-blue-500/20' : 'bg-white/5'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy size={16} className={playerStats.totalGames >= 10 ? 'text-blue-400' : 'text-gray-400'} />
                      <span className={`text-sm font-semibold ${playerStats.totalGames >= 10 ? 'text-blue-300' : 'text-gray-400'}`}>
                        Veteran
                      </span>
                    </div>
                    <p className="text-xs text-blue-200">Play 10 games ({playerStats.totalGames}/10)</p>
                  </div>
                </div>
              </div>

              {/* Favorite Opponents */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Users size={20} />
                  Frequent Opponents
                </h3>
                
                <div className="space-y-2">
                  {playerStats.favoriteOpponents.map((opponent, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {opponent.name[0].toUpperCase()}
                        </div>
                        <span className="text-white text-sm">{opponent.name}</span>
                      </div>
                      <span className="text-blue-300 text-xs">{opponent.count} games</span>
                    </div>
                  ))}
                  
                  {playerStats.favoriteOpponents.length === 0 && (
                    <p className="text-blue-200 text-sm text-center py-4">
                      Play more games to see your frequent opponents!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  
}