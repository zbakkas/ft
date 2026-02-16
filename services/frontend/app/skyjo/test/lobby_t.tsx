"use client";

import React, { useState } from 'react';
import { 
  Shuffle, 
  RefreshCw, 
  Trophy, 
  Users, 
  Search, 
  Plus, 
  Play, 
  Lock, 
  Crown, 
  Calendar, 
  Clock,
  BarChart3,
  TrendingUp,
  Medal,
  Target,
  Star,
  ArrowLeft,
  Award,
  Activity
} from 'lucide-react';

const SkyjoLobby = () => {
  const [gameState, setGameState] = useState('lobby'); // lobby, room, playing, dashboard
  const [currentRoom, setCurrentRoom] = useState(null);
  const [playerName, setPlayerName] = useState('zbakkas');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState(4);
  
  // Game state
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [deck, setDeck] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [gamePhase, setGamePhase] = useState('draw');
  const [winner, setWinner] = useState(null);

  // Dashboard data
  const [gameHistory, setGameHistory] = useState([
    {
      id: 1001,
      roomName: "Championship Final",
      date: "2025-08-22",
      time: "20:15:30",
      players: ["zbakkas", "Alice", "Bob", "Charlie"],
      winner: "zbakkas",
      finalScore: 15,
      position: 1,
      duration: "12:45",
      roomId: 2045
    },
    {
      id: 1002,
      roomName: "Quick Match",
      date: "2025-08-22",
      time: "19:30:15",
      players: ["zbakkas", "Diana", "Eva"],
      winner: "Diana",
      finalScore: 28,
      position: 2,
      duration: "08:30",
      roomId: 1876
    },
    {
      id: 1003,
      roomName: "Pro Players Only",
      date: "2025-08-22",
      time: "18:45:20",
      players: ["zbakkas", "Frank", "Grace", "Henry"],
      winner: "zbakkas",
      finalScore: 12,
      position: 1,
      duration: "15:20",
      roomId: 1654
    },
    {
      id: 1004,
      roomName: "Casual Play",
      date: "2025-08-21",
      time: "21:10:45",
      players: ["zbakkas", "Ivy", "Jack"],
      winner: "Jack",
      finalScore: 35,
      position: 3,
      duration: "09:15",
      roomId: 1432
    },
    {
      id: 1005,
      roomName: "Speed Round",
      date: "2025-08-21",
      time: "20:25:10",
      players: ["zbakkas", "Kate"],
      winner: "zbakkas",
      finalScore: 8,
      position: 1,
      duration: "06:30",
      roomId: 1298
    },
    {
      id: 1006,
      roomName: "Masters League",
      date: "2025-08-21",
      time: "19:40:30",
      players: ["zbakkas", "Liam", "Maya", "Noah"],
      winner: "Maya",
      finalScore: 22,
      position: 2,
      duration: "18:45",
      roomId: 1187
    },
    {
      id: 1007,
      roomName: "Fun Game",
      date: "2025-08-20",
      time: "22:05:15",
      players: ["zbakkas", "Olivia", "Paul"],
      winner: "zbakkas",
      finalScore: 18,
      position: 1,
      duration: "11:20",
      roomId: 1056
    },
    {
      id: 1008,
      roomName: "Beginner's Luck",
      date: "2025-08-20",
      time: "21:15:40",
      players: ["zbakkas", "Quinn", "Ryan", "Sophia"],
      winner: "Quinn",
      finalScore: 31,
      position: 3,
      duration: "14:10",
      roomId: 987
    }
  ]);

  // Player statistics
  const playerStats = {
    totalGames: gameHistory.length,
    wins: gameHistory.filter(game => game.winner === playerName).length,
    winRate: Math.round((gameHistory.filter(game => game.winner === playerName).length / gameHistory.length) * 100),
    averageScore: Math.round(gameHistory.reduce((sum, game) => sum + game.finalScore, 0) / gameHistory.length),
    bestScore: Math.min(...gameHistory.map(game => game.finalScore)),
    totalPlayTime: gameHistory.reduce((total, game) => {
      const [minutes, seconds] = game.duration.split(':').map(Number);
      return total + minutes + (seconds / 60);
    }, 0),
    favoriteOpponents: (() => {
      const opponents = {};
      gameHistory.forEach(game => {
        game.players.forEach(player => {
          if (player !== playerName) {
            opponents[player] = (opponents[player] || 0) + 1;
          }
        });
      });
      return Object.entries(opponents)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));
    })(),
    recentStreak: (() => {
      let streak = 0;
      for (let i = 0; i < gameHistory.length; i++) {
        if (gameHistory[i].winner === playerName) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    })()
  };

  // Room data
  const [rooms, setRooms] = useState([
    {
      id: 1001,
      name: "Beginner's Game",
      host: "Alice",
      players: ["Alice", "Bob"],
      maxPlayers: 4,
      hasPassword: false,
      status: "waiting",
      createdAt: "2025-08-22 15:45:30"
    },
    {
      id: 1002,
      name: "Pro Players Only",
      host: "Charlie",
      players: ["Charlie", "Diana", "Eva"],
      maxPlayers: 4,
      hasPassword: true,
      status: "waiting",
      createdAt: "2025-08-22 15:52:15"
    },
    {
      id: 1003,
      name: "Quick Match",
      host: "Frank",
      players: ["Frank", "Grace", "Henry"],
      maxPlayers: 4,
      hasPassword: false,
      status: "playing",
      createdAt: "2025-08-22 15:30:45"
    },
    {
      id: 1004,
      name: "Fun Game",
      host: "Liam",
      players: ["Liam"],
      maxPlayers: 3,
      hasPassword: false,
      status: "waiting",
      createdAt: "2025-08-22 15:58:20"
    },
    {
      id: 1005,
      name: "Championship",
      host: "Sarah",
      players: ["Sarah", "Mike"],
      maxPlayers: 4,
      hasPassword: true,
      status: "waiting",
      createdAt: "2025-08-22 15:58:20"
    },
    {
      id: 1006,
      name: "Casual Play",
      host: "Tom",
      players: ["Tom", "Jerry", "Spike"],
      maxPlayers: 4,
      hasPassword: false,
      status: "playing",
      createdAt: "2025-08-22 15:25:00"
    },
    {
      id: 1007,
      name: "Speed Round",
      host: "Alex",
      players: ["Alex"],
      maxPlayers: 2,
      hasPassword: false,
      status: "waiting",
      createdAt: "2025-08-22 16:03:45"
    },
    {
      id: 1008,
      name: "Masters League",
      host: "Emma",
      players: ["Emma", "Oliver"],
      maxPlayers: 8,
      hasPassword: true,
      status: "waiting",
      createdAt: "2025-08-22 15:55:30"
    }
  ]);

  // Filter rooms by ID or name
  const filteredRooms = rooms.filter(room => 
    room.id.toString().includes(searchTerm) ||
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.host.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Initialize deck
  const initializeDeck = () => {
    const cards = [];
    const cardCounts = {
      '-2': 5, '-1': 10, '0': 15, '1': 10, '2': 10, '3': 10,
      '4': 10, '5': 10, '6': 10, '7': 10, '8': 10, '9': 10,
      '10': 10, '11': 10, '12': 10
    };
    
    for (const [value, count] of Object.entries(cardCounts)) {
      for (let i = 0; i < count; i++) {
        cards.push({ value: parseInt(value), id: Math.random() });
      }
    }
    
    return cards.sort(() => Math.random() - 0.5);
  };

  // Create room
  const createRoom = () => {
    if (!newRoomName.trim() || !playerName.trim()) return;
    
    const newRoom = {
      id: Math.floor(Math.random() * 9000) + 1000,
      name: newRoomName,
      host: playerName,
      players: [playerName],
      maxPlayers: newRoomMaxPlayers,
      hasPassword: newRoomPassword.length > 0,
      password: newRoomPassword,
      status: "waiting",
      createdAt: "2025-08-22 18:26:20"
    };
    
    setRooms(prev => [newRoom, ...prev]);
    setCurrentRoom(newRoom);
    setGameState('room');
    setShowCreateRoom(false);
    setNewRoomName('');
    setNewRoomPassword('');
  };

  // Join room
  const joinRoom = (room, password = '') => {
    if (!playerName.trim()) {
      alert('Please enter your name!');
      return;
    }
    
    if (room.hasPassword && password !== room.password) {
      alert('Wrong password!');
      return;
    }
    
    if (room.players.length >= room.maxPlayers) {
      alert('Room full!');
      return;
    }
    
    if (room.status === 'playing') {
      alert('Game already started!');
      return;
    }
    
    const updatedRoom = {
      ...room,
      players: [...room.players, playerName]
    };
    
    setRooms(prev => prev.map(r => r.id === room.id ? updatedRoom : r));
    setCurrentRoom(updatedRoom);
    setGameState('room');
  };

  // Start game
  const startGame = () => {
    if (currentRoom.players.length < 2) {
      alert('Need at least 2 players!');
      return;
    }
    
    const shuffledDeck = initializeDeck();
    const newPlayers = [];
    
    currentRoom.players.forEach((playerName, i) => {
      const playerCards = [];
      for (let j = 0; j < 12; j++) {
        playerCards.push({
          ...shuffledDeck.pop(),
          revealed: j < 2,
          position: j
        });
      }
      
      newPlayers.push({
        id: i,
        name: playerName,
        cards: playerCards,
        score: 0
      });
    });
    
    setPlayers(newPlayers);
    setDeck(shuffledDeck);
    setDiscardPile([shuffledDeck.pop()]);
    setGameState('playing');
    setCurrentPlayer(0);
  };

  // Leave room
  const leaveRoom = () => {
    setCurrentRoom(null);
    setGameState('lobby');
  };

  // Back to lobby
  const backToLobby = () => {
    setGameState('lobby');
    setCurrentRoom(null);
    setPlayers([]);
    setCurrentPlayer(0);
    setDeck([]);
    setDiscardPile([]);
    setSelectedCard(null);
    setGamePhase('draw');
    setWinner(null);
  };

  // Format time
  const formatTime = (timeString) => {
    return timeString.split(' ')[1].substring(0, 5);
  };

  // Format play time
  const formatPlayTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Dashboard screen
  if (gameState === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-6 px-4">
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
                <button
                  onClick={() => setGameState('lobby')}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} className="text-white" />
                </button>
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
                
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
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

  // Lobby screen (updated with dashboard button)
  if (gameState === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center py-6 px-4">
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

        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/20">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                  <Trophy size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Skyjo Online</h1>
                  <p className="text-blue-200 text-sm">Welcome back, {playerName}!</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGameState('dashboard')}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                >
                  <BarChart3 size={16} />
                  Dashboard
                </button>
                <button
                  onClick={() => setShowCreateRoom(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                >
                  <Plus size={16} />
                  Create Room
                </button>
              </div>
            </div>
          </div>

          {/* Rooms List Section - Centered */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
            <div className="p-4 border-b border-white/20">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users size={20} />
                  Available Rooms
                  <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs">
                    {filteredRooms.length}
                  </span>
                </h2>
                
                {/* Search Bar inside Available Rooms */}
                <div className="relative lg:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" size={14} />
                  <input
                    type="text"
                    placeholder="Search by ID, name, or host..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-xs"
                  />
                </div>
              </div>
            </div>
            
            {/* Scrollable Rooms Container with Custom Scrollbar */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {filteredRooms.length === 0 ? (
                <div className="p-6 text-center">
                  <Search size={36} className="mx-auto mb-3 text-blue-300 opacity-50" />
                  <p className="text-blue-200 text-sm">No rooms found</p>
                  <p className="text-blue-300 text-xs mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {filteredRooms.map(room => (
                    <div key={room.id} className="p-3 hover:bg-white/5 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded font-mono text-xs">
                              #{room.id}
                            </span>
                            <h3 className="text-white font-semibold text-sm">{room.name}</h3>
                            {room.hasPassword && (
                              <Lock size={12} className="text-yellow-400" />
                            )}
                            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              room.status === 'waiting' 
                                ? 'bg-green-500/20 text-green-300' 
                                : 'bg-orange-500/20 text-orange-300'
                            }`}>
                              {room.status === 'waiting' ? '🟢 Open' : '🟡 Playing'}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-blue-200 text-xs mb-1">
                            <div className="flex items-center gap-1">
                              <Crown size={10} />
                              <span>{room.host}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users size={10} />
                              <span>{room.players.length}/{room.maxPlayers}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={10} />
                              <span>{formatTime(room.createdAt)}</span>
                            </div>
                          </div>

                          <div className="flex gap-1 flex-wrap">
                            {room.players.map((player, index) => (
                              <div key={index} className="bg-white/20 text-white px-2 py-0.5 rounded text-xs">
                                {player}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            if (room.hasPassword) {
                              const password = prompt('🔒 Enter room password:');
                              if (password) joinRoom(room, password);
                            } else {
                              joinRoom(room);
                            }
                          }}
                          disabled={room.players.length >= room.maxPlayers || room.status === 'playing'}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 flex items-center gap-1 ml-3"
                        >
                          <Play size={12} />
                          {room.status === 'playing' ? 'Playing' : 'Join'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Room Modal */}
        {showCreateRoom && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800/95 backdrop-blur-md rounded-xl p-6 max-w-md w-full border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">🎮 Create New Room</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-blue-200 mb-1 text-xs font-medium">Room Name</label>
                  <input 
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Enter room name..."
                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-blue-200 mb-1 text-xs font-medium">Password (Optional)</label>
                  <input
                    type="password"
                    value={newRoomPassword}
                    onChange={(e) => setNewRoomPassword(e.target.value)}
                    placeholder="Leave empty for public room..."
                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-blue-200 mb-1 text-xs font-medium">Max Players</label>
                  <select
                    value={newRoomMaxPlayers}
                    onChange={(e) => setNewRoomMaxPlayers(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  >
                    <option value={2} className="bg-slate-800">2 Players</option>
                    <option value={3} className="bg-slate-800">3 Players</option>
                    <option value={4} className="bg-slate-800">4 Players</option>
                    <option value={5} className="bg-slate-800">5 Players</option>
                    <option value={6} className="bg-slate-800">6 Players</option>
                    <option value={7} className="bg-slate-800">7 Players</option>
                    <option value={8} className="bg-slate-800">8 Players</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateRoom(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createRoom}
                  disabled={!newRoomName.trim()}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all duration-200"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Room waiting screen
  if (gameState === 'room') {
    const isHost = currentRoom && currentRoom.host === playerName;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center py-6 px-4">
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

        <div className="max-w-2xl w-full">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded font-mono text-sm">
                    #{currentRoom?.id}
                  </span>
                  <h1 className="text-2xl font-bold text-white">{currentRoom?.name}</h1>
                </div>
                <div className="flex items-center gap-4 text-blue-200 text-sm">
                  <div className="flex items-center gap-1">
                    <Crown size={14} />
                    <span>Host: {currentRoom?.host}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>{currentRoom?.players.length}/{currentRoom?.maxPlayers} Players</span>
                  </div>
                  {currentRoom?.hasPassword && (
                    <div className="flex items-center gap-1">
                      <Lock size={14} />
                      <span>Private</span>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={leaveRoom}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Leave Room
              </button>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Players</h2>
              
              {/* Scrollable Players Container */}
              <div className="max-h-80 overflow-y-auto custom-scrollbar mb-6">
                <div className="space-y-2 pr-2">
                  {currentRoom?.players.map((player, index) => (
                    <div key={index} className="bg-white/10 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {player[0].toUpperCase()}
                        </div>
                        <span className="text-white font-medium text-sm">{player}</span>
                        {player === currentRoom?.host && (
                          <Crown size={14} className="text-yellow-400" />
                        )}
                        {player === playerName && (
                          <span className="text-blue-300 text-xs">(You)</span>
                        )}
                      </div>
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                  ))}
                  
                  {Array.from({ length: currentRoom?.maxPlayers - currentRoom?.players.length }).map((_, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-3 flex items-center gap-3 border-2 border-dashed border-white/20">
                      <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                        <Users size={16} className="text-white/50" />
                      </div>
                      <span className="text-white/50 text-sm">Waiting for player...</span>
                    </div>
                  ))}
                </div>
              </div>

              {isHost && (
                <div>
                  <button
                    onClick={startGame}
                    disabled={currentRoom?.players.length < 2}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Play size={18} />
                    Start Game
                  </button>
                  {currentRoom?.players.length < 2 && (
                    <p className="text-yellow-300 text-sm mt-2 text-center">
                      Need at least 2 players to start
                    </p>
                  )}
                </div>
              )}

              {!isHost && (
                <div className="text-center">
                  <p className="text-blue-200 text-sm">Waiting for host to start the game...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Placeholder for other game states
  return <div>Other game states...</div>;
};

export default SkyjoLobby;