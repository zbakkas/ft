"use client";

import React, { useState } from 'react';
import { Shuffle, RefreshCw, Trophy, Users, Search, Plus, Play, Lock, Crown, Calendar, Clock, MoreHorizontal, User, Grid, MessageCircle } from 'lucide-react';

const SkyjoGame = () => {
  const [gameState, setGameState] = useState('lobby');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [playerName, setPlayerName] = useState('zbakkas');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState(4);
  
  // Simple 2-player game like the original image
  const [players, setPlayers] = useState([
    {
      id: 0,
      name: 'Lu',
      score: 39,
      cards: [
        { value: null, revealed: false }, { value: null, revealed: false }, { value: 9, revealed: true }, { value: null, revealed: false },
        { value: null, revealed: false }, { value: null, revealed: false }, { value: 7, revealed: true }, { value: null, revealed: false },
        { value: 1, revealed: true }, { value: 4, revealed: true }, { value: 11, revealed: true }, { value: 7, revealed: true }
      ]
    },
    {
      id: 1,
      name: 'zbakkas (You)',
      score: 23,
      cards: [
        { value: null, revealed: false }, { value: null, revealed: false }, { value: null, revealed: false }, { value: -2, revealed: true },
        { value: null, revealed: false }, { value: 10, revealed: true }, { value: 5, revealed: true }, { value: 7, revealed: true },
        { value: null, revealed: false }, { value: null, revealed: false }, { value: 1, revealed: true }, { value: 2, revealed: true }
      ]
    }
  ]);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [discardPile, setDiscardPile] = useState({ value: 6 });
  const [drawnCard, setDrawnCard] = useState(null);
  const [gamePhase, setGamePhase] = useState('draw');

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
    }
  ]);

  const filteredRooms = rooms.filter(room => 
    room.id.toString().includes(searchTerm) ||
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.host.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      createdAt: "2025-08-22 18:50:30"
    };
    
    setRooms(prev => [newRoom, ...prev]);
    setCurrentRoom(newRoom);
    setGameState('room');
    setShowCreateRoom(false);
    setNewRoomName('');
    setNewRoomPassword('');
  };

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

  const startGame = () => {
    if (currentRoom.players.length < 2) {
      alert('Need at least 2 players!');
      return;
    }
    setGameState('playing');
  };

  const leaveRoom = () => {
    setCurrentRoom(null);
    setGameState('lobby');
  };

  const backToLobby = () => {
    setGameState('lobby');
    setCurrentRoom(null);
  };

  const formatTime = (timeString) => {
    return timeString.split(' ')[1].substring(0, 5);
  };

  // Get card color - EXACT like original image
  const getCardColor = (value) => {
    if (value === null) return 'bg-gray-700';
    if (value <= 0) return 'bg-blue-500';
    if (value <= 4) return 'bg-green-500';
    if (value <= 7) return 'bg-yellow-500';
    if (value <= 10) return 'bg-red-400';
    return 'bg-red-600';
  };

  const handleCardClick = (playerIndex, cardIndex) => {
    if (playerIndex !== currentPlayer) return;
    
    const card = players[playerIndex].cards[cardIndex];
    
    if (gamePhase === 'draw' && !card.revealed) {
      const newPlayers = [...players];
      newPlayers[playerIndex].cards[cardIndex].revealed = true;
      setPlayers(newPlayers);
    } else if (gamePhase === 'replace' && drawnCard !== null) {
      const newPlayers = [...players];
      newPlayers[playerIndex].cards[cardIndex] = {
        value: drawnCard,
        revealed: true
      };
      setPlayers(newPlayers);
      setDrawnCard(null);
      setGamePhase('draw');
    }
  };

  const handlePileClick = (pile) => {
    if (gamePhase !== 'draw') return;
    
    if (pile === 'draw') {
      const randomValue = Math.floor(Math.random() * 13) - 2;
      setDrawnCard(randomValue);
      setGamePhase('replace');
    } else if (pile === 'discard') {
      setDrawnCard(discardPile.value);
      setGamePhase('replace');
    }
  };

  // CLEAN SIMPLE GAME SCREEN - Just like the original image
  if (gameState === 'playing') {
    return (
      <div className="h-screen bg-gray-900 flex flex-col items-center justify-center relative">
        {/* Sidebar buttons */}
        <div className="fixed right-4 top-4 space-y-2">
          <button className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600">
            <MoreHorizontal size={20} />
          </button>
          <button className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600">
            <User size={20} />
          </button>
          <button className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600">
            <Grid size={20} />
          </button>
        </div>

        <div className="fixed right-4 bottom-4">
          <button className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600">
            <MessageCircle size={20} />
          </button>
        </div>

        {/* Top player (Lu) */}
        <div className="mb-12">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">⚡</span>
              </div>
              <span className="text-white font-medium">{players[0].name}</span>
            </div>
            <span className="text-gray-400 text-sm">{players[0].score}</span>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {players[0].cards.map((card, index) => (
              <div
                key={index}
                className={`w-16 h-20 rounded-lg flex items-center justify-center text-white font-bold ${
                  card.revealed ? getCardColor(card.value) : 'bg-gray-700'
                }`}
              >
                {card.revealed ? card.value : ''}
              </div>
            ))}
          </div>
        </div>

        {/* Center - Piles */}
        <div className="mb-12">
          <div className="text-white text-center mb-4">Choose a pile</div>
          <div className="flex gap-6">
            <div
              className="w-20 h-24 bg-gray-700 rounded-lg cursor-pointer"
              onClick={() => handlePileClick('draw')}
            />
            <div
              className={`w-20 h-24 rounded-lg cursor-pointer flex items-center justify-center text-white font-bold text-xl ${getCardColor(discardPile.value)}`}
              onClick={() => handlePileClick('discard')}
            >
              {discardPile.value}
            </div>
          </div>
        </div>

        {/* Bottom player (You) */}
        <div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {players[1].cards.map((card, index) => (
              <div
                key={index}
                className={`w-16 h-20 rounded-lg flex items-center justify-center text-white font-bold cursor-pointer hover:scale-105 transition-transform ${
                  card.revealed ? getCardColor(card.value) : 'bg-gray-700'
                }`}
                onClick={() => handleCardClick(1, index)}
              >
                {card.revealed ? card.value : ''}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">👤</span>
              </div>
              <span className="text-white font-medium">{players[1].name}</span>
            </div>
            <span className="text-gray-400 text-sm">{players[1].score}</span>
          </div>
        </div>

        {/* Drawn card */}
        {drawnCard !== null && (
          <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-white mb-2">You drew:</div>
            <div className={`w-16 h-20 rounded-lg flex items-center justify-center text-white font-bold text-lg ${getCardColor(drawnCard)}`}>
              {drawnCard}
            </div>
          </div>
        )}

        <button
          onClick={backToLobby}
          className="fixed bottom-4 left-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Leave
        </button>
      </div>
    );
  }

  // Simple lobby
  if (gameState === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/20">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                  <Trophy size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Skyjo Online</h1>
                  <p className="text-blue-200 text-sm">Welcome back, {playerName}!</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus size={16} />
                Create Room
              </button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
            <div className="p-4 border-b border-white/20">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users size={20} />
                  Available Rooms ({filteredRooms.length})
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" size={14} />
                  <input
                    type="text"
                    placeholder="Search rooms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-200 text-sm"
                  />
                </div>
              </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {filteredRooms.map(room => (
                <div key={room.id} className="p-4 hover:bg-white/5 border-b border-white/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs font-mono">
                          #{room.id}
                        </span>
                        <h3 className="text-white font-semibold">{room.name}</h3>
                        {room.hasPassword && <Lock size={14} className="text-yellow-400" />}
                        <span className={`px-2 py-1 rounded text-xs ${
                          room.status === 'waiting' ? 'bg-green-500/20 text-green-300' : 'bg-orange-500/20 text-orange-300'
                        }`}>
                          {room.status === 'waiting' ? 'Open' : 'Playing'}
                        </span>
                      </div>
                      <div className="text-blue-200 text-sm">
                        Host: {room.host} • {room.players.length}/{room.maxPlayers} players
                      </div>
                    </div>
                    <button
                      onClick={() => joinRoom(room)}
                      disabled={room.players.length >= room.maxPlayers || room.status === 'playing'}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {showCreateRoom && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-white mb-4">Create New Room</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-blue-200 mb-1 text-sm">Room Name</label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-blue-200 mb-1 text-sm">Max Players</label>
                  <select
                    value={newRoomMaxPlayers}
                    onChange={(e) => setNewRoomMaxPlayers(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white"
                  >
                    <option value={2}>2 Players</option>
                    <option value={3}>3 Players</option>
                    <option value={4}>4 Players</option>
                    <option value={5}>5 Players</option>
                    <option value={6}>6 Players</option>
                    <option value={7}>7 Players</option>
                    <option value={8}>8 Players</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateRoom(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={createRoom}
                  disabled={!newRoomName.trim()}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg disabled:opacity-50"
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

  // Simple room screen
  if (gameState === 'room') {
    const isHost = currentRoom && currentRoom.host === playerName;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{currentRoom?.name}</h1>
              <div className="text-blue-200 text-sm">
                Host: {currentRoom?.host} • {currentRoom?.players.length}/{currentRoom?.maxPlayers} players
              </div>
            </div>
            <button
              onClick={leaveRoom}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Leave
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Players</h2>
            <div className="space-y-2">
              {currentRoom?.players.map((player, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {player[0].toUpperCase()}
                    </div>
                    <span className="text-white">{player}</span>
                    {player === currentRoom?.host && <Crown size={16} className="text-yellow-400" />}
                    {player === playerName && <span className="text-blue-300 text-sm">(You)</span>}
                  </div>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
              ))}
              
              {Array.from({ length: currentRoom?.maxPlayers - currentRoom?.players.length }).map((_, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-3 border-2 border-dashed border-white/20">
                  <span className="text-white/50">Waiting for player...</span>
                </div>
              ))}
            </div>
          </div>

          {isHost && (
            <button
              onClick={startGame}
              disabled={currentRoom?.players.length < 2}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg disabled:opacity-50"
            >
              <Play size={18} className="inline mr-2" />
              Start Game
            </button>
          )}

          {!isHost && (
            <div className="text-center text-blue-200">
              Waiting for host to start the game...
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
};

export default SkyjoGame;