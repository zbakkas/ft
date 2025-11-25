"use client";
import { Lock, Clock, Crown, Plus, Search, Users, Play } from "lucide-react";
import { SetStateAction, useEffect, useState } from "react";
import AvailableRoom from "./Avaliableroom";
import { useRouter } from "next/navigation";
import { useSocket } from '../contexts/SocketContext';
import { setCookie, getCookie } from './cookies'; // Import cookie utilities

export default function Lobby2() {
  const { name_player, joinLobby, createRoom: socketCreateRoom, connected, rooms, joinRoom } = useSocket();

  // Initialize userName from cookie or fallback to name_player
  const [userName, setUserName] = useState('');

  // Load username from cookie on component mount
  useEffect(() => {
    const savedUserName = getCookie('userName');
    if (savedUserName) {
      setUserName(savedUserName);
    } else if (name_player) {
      setUserName(name_player);
    }
  }, [name_player]);

  // Join lobby when userName changes
  useEffect(() => {
    if (userName) {
      joinLobby(userName);
    }
  }, [userName, joinLobby]);

  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState(4);
  const [avatarUrl, setAvatarUrl] = useState('');
  const router = useRouter();

  // Filter rooms by ID or name
  const filteredRooms = rooms.filter(room => 
    room.roomId.toString().includes(searchTerm) ||
    room.room_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.ownirName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create room
  const createRoom = () => {
    if (!newRoomName.trim() || !userName.trim()) return;
    setShowCreateRoom(false);
    setNewRoomName('');
    setNewRoomPassword('');
    socketCreateRoom(newRoomName, userName, newRoomMaxPlayers, newRoomPassword,avatarUrl);
    router.push(`/room`);
  };

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

  // Modified handleNameChange to save to cookie
  const handleNameChange = (e) => {
    const value = e.target.value;
    if (value.length <= 10) {
      setUserName(value);
      // Save to cookie whenever username changes
      setCookie('userName', value, 30); // Save for 30 days
    }
  };

  const handleAvatarSelect = (index) => {
    setSelectedAvatar(index);
    setShowAvatarPicker(false);
    // Optionally save selected avatar to cookie too
    setCookie('selectedAvatar', index.toString(), 30);
    setAvatarUrl(avatars[index]);
  };

  const generateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const colors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd93d', 'ffb3ba', 'bae1ff', 'caffbf', 'a8dadc'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}&backgroundColor=${randomColor}`;
  };

  const handleRandomAvatar = () => {
    const newAvatarUrl = generateRandomAvatar();
    const newAvatars = [...avatars];
    newAvatars[avatars.length - 1] = newAvatarUrl;
    setSelectedAvatar(avatars.length - 1);
    setShowAvatarPicker(false);
    setCookie('selectedAvatar', (avatars.length - 1).toString(), 30);
    setAvatarUrl(newAvatarUrl);
  };

  // Load saved avatar on component mount
  useEffect(() => {
    const savedAvatar = getCookie('selectedAvatar');
    if (savedAvatar) {
      setSelectedAvatar(parseInt(savedAvatar));
      setAvatarUrl(avatars[parseInt(savedAvatar)]);
    }
  }, []);

  return (
    <div className="">
      <div className="max-w-4xl w-full m-auto pt-18">
        <div className="flex items-center justify-between border border-gray-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 bg-white/10">
          <div className="flex items-center gap-3">
            {/* Avatar Display */}
            <div className="relative">
              <div 
                className="w-12 h-12 bg-white/10 border border-white/30 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all hover:scale-105 overflow-hidden"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              >
                <img 
                  src={avatars[selectedAvatar]} 
                  alt="Avatar" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              
              {/* Avatar Picker Dropdown */}
              {showAvatarPicker && (
                <div className="absolute top-14 left-0 z-50 bg-gray-800/95 backdrop-blur-sm border border-white/30 rounded-lg p-3 shadow-2xl min-w-max">
                  <div className="grid grid-cols-6 gap-2 mb-2">
                    {avatars.map((avatar, index) => (
                      <button
                        key={index}
                        onClick={() => handleAvatarSelect(index)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden hover:bg-white/20 transition-all border-2 ${
                          selectedAvatar === index ? 'border-blue-500 scale-110' : 'border-white/30'
                        }`}
                      >
                        <img 
                          src={avatar} 
                          alt={`Avatar ${index + 1}`} 
                          className="w-full h-full object-cover rounded-full"
                        />
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={handleRandomAvatar}
                    className="w-full text-xs text-blue-300 hover:text-white bg-white/10 hover:bg-white/20 rounded px-2 py-1 transition-colors"
                  >
                    🎲 Random
                  </button>
                </div>
              )}
            </div>

            {/* Name Input */}
            <div className="relative">
              <input
                type="text"
                value={userName}
                onChange={handleNameChange}
                maxLength={10}
                className="w-48 px-3 py-2 text-sm bg-white/10 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-blue-300/50"
                placeholder="Enter your name"
              />
              <span className="absolute right-3 top-2.5 text-xs text-blue-300/70">
                {userName.length}/10
              </span>
            </div>
          </div>

          <button 
            onClick={() => setShowCreateRoom(true)}
            disabled={!userName.trim()}
            className="disabled:opacity-50 disabled:hover:scale-none bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
          >
            <Plus size={16} />
            Create Room
          </button>
        </div>
      </div>

      {/* Rest of your component remains the same... */}
      <div className="max-w-4xl w-full m-auto py-9">
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
        
        <div className="transition-all duration-200 bg-white/10 rounded-lg border border-gray-600">
          <div className="p-4 border-b border-white/20">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={16} />
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

          <div className="max-h-140 overflow-y-auto custom-scrollbar">
            {filteredRooms.length === 0 ? (
              <div className="p-6 text-center">
                <Search size={36} className="mx-auto mb-3 text-blue-300 opacity-50" />
                <p className="text-blue-200 text-sm">No rooms found</p>
                <p className="text-blue-300 text-xs mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {filteredRooms.map(room => (
                  <AvailableRoom 
                    key={room.roomId} 
                    player_name={userName}
                    Password_={room.password} 
                    room_status={room.status} 
                    room_host={room.ownirName} 
                    room_players={room.players} 
                    room_maxPlayers={room.max_players}
                    room_name={room.room_name}
                    room_id={String(room.roomId)}
                    joinRoomFunc={() => joinRoom(room.roomId,avatarUrl)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close avatar picker */}
      {showAvatarPicker && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowAvatarPicker(false)}
        />
      )}

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