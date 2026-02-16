"use client";

import React, { useState, useEffect } from 'react';
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
  Activity,
  Settings,
  LogIn,
  LogOut,
  User,
  Edit3,
  Save,
  X,
  BookOpen,
  Filter,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

const SkyjoLobby = () => {
  const [gameState, setGameState] = useState('lobby'); // lobby, room, playing, dashboard, leaderboard, rules
  const [currentRoom, setCurrentRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState(4);
  
  // User/Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerAvatar, setPlayerAvatar] = useState('👤');
  const [showNameAvatarModal, setShowNameAvatarModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempAvatar, setTempAvatar] = useState('👤');
  
  // Guest user state (for non-logged in users)
  const [guestName, setGuestName] = useState('');
  const [guestAvatar, setGuestAvatar] = useState('👤');
  const [showGuestAvatarPicker, setShowGuestAvatarPicker] = useState(false);
  
  // Leaderboard filters
  const [leaderboardFilter, setLeaderboardFilter] = useState('all'); // all, friends, country
  const [leaderboardSort, setLeaderboardSort] = useState('rank'); // rank, wins, winRate
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const itemsPerPage = 10;
  
  // Available avatars
  const availableAvatars = [
    '👤', '😀', '😎', '🤓', '😊', '🥳', '😇', '🤠', 
    '👩', '👨', '👦', '👧', '🧑', '👶', '👴', '👵',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🎮', '🏆', '⭐', '💎', '🔥', '⚡', '🌟', '🎯'
  ];
  
  // Game state
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [deck, setDeck] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [gamePhase, setGamePhase] = useState('draw');
  const [winner, setWinner] = useState(null);

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

  // Get current player name (logged in or guest)
  const getCurrentPlayerName = () => {
    return isLoggedIn ? playerName : guestName;
  };

  // Get current player avatar (logged in or guest)
  const getCurrentPlayerAvatar = () => {
    return isLoggedIn ? playerAvatar : guestAvatar;
  };

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

  // Player statistics
  const playerStats = {
    totalGames: gameHistory.length,
    wins: gameHistory.filter(game => game.winner === getCurrentPlayerName()).length,
    winRate: Math.round((gameHistory.filter(game => game.winner === getCurrentPlayerName()).length / gameHistory.length) * 100),
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
          if (player !== getCurrentPlayerName()) {
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
        if (gameHistory[i].winner === getCurrentPlayerName()) {
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
      createdAt: "2025-08-23 15:45:30"
    },
    {
      id: 1002,
      name: "Pro Players Only",
      host: "Charlie",
      players: ["Charlie", "Diana", "Eva"],
      maxPlayers: 4,
      hasPassword: true,
      status: "waiting",
      createdAt: "2025-08-23 15:52:15"
    },
    {
      id: 1003,
      name: "Quick Match",
      host: "Frank",
      players: ["Frank", "Grace", "Henry"],
      maxPlayers: 4,
      hasPassword: false,
      status: "playing",
      createdAt: "2025-08-23 15:30:45"
    },
    {
      id: 1004,
      name: "Fun Game",
      host: "Liam",
      players: ["Liam"],
      maxPlayers: 3,
      hasPassword: false,
      status: "waiting",
      createdAt: "2025-08-23 15:58:20"
    },
    {
      id: 1005,
      name: "Championship",
      host: "Sarah",
      players: ["Sarah", "Mike"],
      maxPlayers: 4,
      hasPassword: true,
      status: "waiting",
      createdAt: "2025-08-23 15:58:20"
    },
    {
      id: 1006,
      name: "Casual Play",
      host: "Tom",
      players: ["Tom", "Jerry", "Spike"],
      maxPlayers: 4,
      hasPassword: false,
      status: "playing",
      createdAt: "2025-08-23 15:25:00"
    },
    {
      id: 1007,
      name: "Speed Round",
      host: "Alex",
      players: ["Alex"],
      maxPlayers: 2,
      hasPassword: false,
      status: "waiting",
      createdAt: "2025-08-23 16:03:45"
    },
    {
      id: 1008,
      name: "Masters League",
      host: "Emma",
      players: ["Emma", "Oliver"],
      maxPlayers: 8,
      hasPassword: true,
      status: "waiting",
      createdAt: "2025-08-23 15:55:30"
    }
  ]);

  // Initialize user session
  useEffect(() => {
    // Check if user is "logged in" (for demo purposes)
    const savedUser = localStorage.getItem('skyjo-user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setIsLoggedIn(true);
      setPlayerName(user.name);
      setPlayerAvatar(user.avatar);
    }
  }, []);

  // Filter rooms by ID or name
  const filteredRooms = rooms.filter(room => 
    room.id.toString().includes(searchTerm) ||
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.host.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Save user data
  const saveUserData = () => {
    if (!tempName.trim()) {
      alert('Please enter your name!');
      return;
    }
    
    const userData = {
      name: tempName.trim(),
      avatar: tempAvatar
    };
    
    localStorage.setItem('skyjo-user', JSON.stringify(userData));
    setPlayerName(userData.name);
    setPlayerAvatar(userData.avatar);
    setIsLoggedIn(true);
    setShowNameAvatarModal(false);
  };

  // Login (demo function)
  const handleLogin = () => {
    // For demo purposes, simulate login with zbakkas
    const userData = {
      name: 'zbakkas',
      avatar: '👤'
    };
    
    localStorage.setItem('skyjo-user', JSON.stringify(userData));
    setPlayerName(userData.name);
    setPlayerAvatar(userData.avatar);
    setIsLoggedIn(true);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('skyjo-user');
    setIsLoggedIn(false);
    setPlayerName('');
    setPlayerAvatar('👤');
    setGameState('lobby');
    // Reset guest info too
    setGuestName('');
    setGuestAvatar('👤');
  };

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
    const currentName = getCurrentPlayerName();
    if (!newRoomName.trim() || !currentName.trim()) {
      alert('Please enter room name and your name!');
      return;
    }
    
    const newRoom = {
      id: Math.floor(Math.random() * 9000) + 1000,
      name: newRoomName,
      host: currentName,
      players: [currentName],
      maxPlayers: newRoomMaxPlayers,
      hasPassword: newRoomPassword.length > 0,
      password: newRoomPassword,
      status: "waiting",
      createdAt: "2025-08-23 18:26:20"
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
    const currentName = getCurrentPlayerName();
    if (!currentName.trim()) {
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
      players: [...room.players, currentName]
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

  // Navbar Component
  const Navbar = () => (
    <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
            <Trophy size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Skyjo Online</h1>
            <p className="text-blue-200 text-xs">Card Game Championship</p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setGameState('lobby')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              gameState === 'lobby' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/10 text-blue-200 hover:bg-white/20'
            }`}
          >
            🏠 Lobby
          </button>
          
          <button
            onClick={() => setGameState('leaderboard')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              gameState === 'leaderboard' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/10 text-blue-200 hover:bg-white/20'
            }`}
          >
            🏆 Leaderboard
          </button>

          <button
            onClick={() => setGameState('rules')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              gameState === 'rules' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/10 text-blue-200 hover:bg-white/20'
            }`}
          >
            📖 Rules
          </button>

          <button
            className="bg-white/10 text-blue-200 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
          >
            ⚙️ Settings
          </button>

          {isLoggedIn ? (
            <>
              <button
                onClick={() => setGameState('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  gameState === 'dashboard' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                📊 Dashboard
              </button>
              
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <span className="text-xl">{playerAvatar}</span>
                <span className="text-white text-sm font-medium">{playerName}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <LogIn size={16} />
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );

  // Name/Avatar Modal
  const NameAvatarModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800/95 backdrop-blur-md rounded-xl p-6 max-w-md w-full border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4 text-center">🎮 Welcome to Skyjo!</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-blue-200 mb-2 text-sm font-medium">Your Name</label>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              maxLength={20}
            />
          </div>
          
          <div>
            <label className="block text-blue-200 mb-2 text-sm font-medium">Choose Avatar</label>
            <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto">
              {availableAvatars.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => setTempAvatar(avatar)}
                  className={`w-8 h-8 rounded-lg text-lg hover:bg-white/20 transition-colors ${
                    tempAvatar === avatar ? 'bg-blue-500' : 'bg-white/10'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-blue-200 text-xs mb-3">Selected: {tempAvatar}</p>
            <button
              onClick={saveUserData}
              disabled={!tempName.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50 transition-all duration-200"
            >
              Start Playing!
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Guest Avatar Picker
  const GuestAvatarPicker = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800/95 backdrop-blur-md rounded-xl p-4 max-w-sm w-full border border-white/20">
        <h3 className="text-lg font-bold text-white mb-3 text-center">Choose Your Avatar</h3>
        
        <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto mb-4">
          {availableAvatars.map((avatar, index) => (
            <button
              key={index}
              onClick={() => setGuestAvatar(avatar)}
              className={`w-8 h-8 rounded-lg text-lg hover:bg-white/20 transition-colors ${
                guestAvatar === avatar ? 'bg-blue-500' : 'bg-white/10'
              }`}
            >
              {avatar}
            </button>
          ))}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowGuestAvatarPicker(false)}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => setShowGuestAvatarPicker(false)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );

  // Rules screen
  if (gameState === 'rules') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navbar />
        
        <div className="py-6 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl">
                    <BookOpen size={32} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Skyjo Rules</h1>
                    <p className="text-blue-200">Learn how to play Skyjo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rules Content */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    🎯 Objective
                  </h2>
                  <p className="text-blue-100">
                    The goal of Skyjo is to have the lowest score possible after all cards are revealed. 
                    Each card has a point value, and lower numbers are better!
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    🃏 Setup
                  </h2>
                  <ul className="text-blue-100 space-y-2 list-disc list-inside">
                    <li>Each player gets 12 cards arranged in a 3x4 grid</li>
                    <li>Turn over any 2 cards to start</li>
                    <li>Remaining cards stay face down</li>
                    <li>One card goes to the discard pile, rest form the draw pile</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    🎮 How to Play
                  </h2>
                  <div className="text-blue-100 space-y-3">
                    <p><strong>On your turn:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Draw a card from either the draw pile or discard pile</li>
                      <li>Either replace one of your cards with it, or discard it</li>
                      <li>If you replace a card, the old card goes to discard</li>
                      <li>If you discard the drawn card, you must flip one of your face-down cards</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    📊 Card Values
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-green-500/20 p-3 rounded-lg text-center">
                      <div className="text-green-400 font-bold">-2</div>
                      <div className="text-xs text-green-300">Best cards!</div>
                    </div>
                    <div className="bg-blue-500/20 p-3 rounded-lg text-center">
                      <div className="text-blue-400 font-bold">-1 to 0</div>
                      <div className="text-xs text-blue-300">Great cards</div>
                    </div>
                    <div className="bg-yellow-500/20 p-3 rounded-lg text-center">
                      <div className="text-yellow-400 font-bold">1 to 6</div>
                      <div className="text-xs text-yellow-300">OK cards</div>
                    </div>
                    <div className="bg-red-500/20 p-3 rounded-lg text-center">
                      <div className="text-red-400 font-bold">7 to 12</div>
                      <div className="text-xs text-red-300">Avoid these!</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    ⚡ Special Rules
                  </h2>
                  <ul className="text-blue-100 space-y-2 list-disc list-inside">
                    <li><strong>Column Bonus:</strong> If all 3 cards in a column are the same, they score 0 points!</li>
                    <li><strong>Game End:</strong> When someone has all cards face-up, everyone gets one final turn</li>
                    <li><strong>Winning:</strong> Player with the lowest total score wins the round</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    💡 Tips for Success
                  </h2>
                  <ul className="text-blue-100 space-y-2 list-disc list-inside">
                    <li>Remember what cards other players have discarded</li>
                    <li>Try to create columns of identical cards for bonus points</li>
                    <li>Don't be afraid to take risks with face-down cards</li>
                    <li>Watch what cards opponents pick up from the discard pile</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Leaderboard screen with enhanced features
  if (gameState === 'leaderboard') {
    const { players: paginatedPlayers, totalPages, totalPlayers } = getPaginatedLeaderboard();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navbar />
        
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

  // Dashboard screen (same as before but using getCurrentPlayerName())
  if (gameState === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navbar />
        
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

          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/20">
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
                              {game.winner === getCurrentPlayerName() && (
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
                                    player === getCurrentPlayerName() 
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
      </div>
    );
  }

  // Lobby screen with guest user input
  if (gameState === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navbar />
        
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

          <div className="max-w-4xl mx-auto">
            {/* Guest User Section - Show only if not logged in */}
            {!isLoggedIn && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-white mb-2">🎮 Play as Guest</h2>
                  <p className="text-blue-200 text-sm">Enter your name and choose an avatar to start playing</p>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 max-w-md mx-auto">
                  {/* Avatar Selector */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowGuestAvatarPicker(true)}
                      className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl hover:scale-105 transition-transform"
                    >
                      {guestAvatar}
                    </button>
                    <span className="text-blue-200 text-xs">Choose Avatar</span>
                  </div>
                  
                  {/* Name Input */}
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Enter your name..."
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      maxLength={20}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20">
              <div className="text-center">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setShowCreateRoom(true)}
                    disabled={!isLoggedIn && !guestName.trim()}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={18} />
                    Create Room
                  </button>
                  
                  {isLoggedIn && (
                    <button
                      onClick={() => setShowNameAvatarModal(true)}
                      className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2"
                    >
                      <Edit3 size={16} />
                      Change Avatar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Rooms List Section */}
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
                            disabled={
                              room.players.length >= room.maxPlayers || 
                              room.status === 'playing' || 
                              (!isLoggedIn && !guestName.trim())
                            }
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
                  disabled={!newRoomName.trim() || (!isLoggedIn && !guestName.trim())}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all duration-200"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Name/Avatar Modal for logged in users */}
        {showNameAvatarModal && <NameAvatarModal />}
        
        {/* Guest Avatar Picker */}
        {showGuestAvatarPicker && <GuestAvatarPicker />}
      </div>
    );
  }

  // Room waiting screen
  if (gameState === 'room') {
    const currentName = getCurrentPlayerName();
    const isHost = currentRoom && currentRoom.host === currentName;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navbar />
        
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

          <div className="max-w-2xl mx-auto">
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
                            {player === currentName ? getCurrentPlayerAvatar() : player[0].toUpperCase()}
                          </div>
                          <span className="text-white font-medium text-sm">{player}</span>
                          {player === currentRoom?.host && (
                            <Crown size={14} className="text-yellow-400" />
                          )}
                          {player === currentName && (
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
      </div>
    );
  }

  // Placeholder for other game states (playing, etc.)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navbar />
      <div className="flex items-center justify-center h-screen">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Game State: {gameState}</h2>
          <p className="text-blue-200">This feature is coming soon!</p>
          <button
            onClick={backToLobby}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkyjoLobby;