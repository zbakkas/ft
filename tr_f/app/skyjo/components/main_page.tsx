"use client";
import { Lock, Clock, Crown, Plus, Search, Users, Play } from "lucide-react";
import { SetStateAction, useEffect, useState } from "react";
import AvailableRoom from "./Avaliableroom";
import { useRouter } from "next/navigation";
import { useSocket } from '../contexts/SocketContext';
import { setCookie, getCookie } from './cookies';
import { fetchUserProfile } from '../utils/fetchUserProfile';

export default function Lobby2() {
  const { playerID, joinLobby, createRoom: socketCreateRoom, connected, rooms, joinRoom } = useSocket();

  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState(4);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userName, setUserName] = useState('');
  const router = useRouter();

  // Fetch user profile
  useEffect(() => {
    if (playerID) {
      fetchUserProfile(playerID).then((profile) => {
        setUserName(profile.username);
        setAvatarUrl(profile.avatarUrl);
      });
    }
  }, [playerID]);

  // Filter rooms
  const filteredRooms = rooms.filter(room => 
    room.roomId.toString().includes(searchTerm) ||
    room.room_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.ownirName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create room
  const createRoom = () => {
    if (!newRoomName.trim()) return;
    setShowCreateRoom(false);
    setNewRoomName('');
    setNewRoomPassword('');
    socketCreateRoom(newRoomName, userName, newRoomMaxPlayers, newRoomPassword, avatarUrl);
    router.push(`/skyjo/room`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black font-mono relative overflow-hidden">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)',
            backgroundSize: '40px 40px'
      }}></div>

      <div className="relative z-10 max-w-4xl w-full m-auto pt-10 px-4">
        
        {/* User Profile Bar */}
        <div className="flex items-center justify-between border border-cyan-500/30 px-6 py-4 rounded-2xl bg-gray-900/60 backdrop-blur-md shadow-[0_0_20px_rgba(34,211,238,0.1)] mb-8">
          <div className="flex items-center gap-4">
            {/* Avatar Display */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full blur opacity-30 group-hover:opacity-75 transition duration-200"></div>
              <div 
                className="relative w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center cursor-pointer overflow-hidden border-2 border-cyan-500/50"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Users size={24} className="text-cyan-400" />
                )}
              </div>
            </div>

            {/* Name Display */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest">Player Name</p>
              <div className="text-xl font-bold text-white drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                 {userName || "Guest"}
              </div>
            </div>
          </div>

          <button 
            suppressHydrationWarning
            onClick={() => setShowCreateRoom(true)}
            className="group relative px-6 py-3 bg-gray-900 text-cyan-400 border border-cyan-500/50 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-cyan-500/10 transition-all duration-200 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Plus size={16} /> Create Room
            </span>
            <div className="absolute inset-0 bg-cyan-400/10 transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
          </button>
        </div>

        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #06b6d4; border-radius: 3px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0891b2; }
        `}</style>                                       
        
        {/* Rooms Container */}
        <div className="bg-gray-900/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="p-6 border-b border-white/10 bg-gray-900/50">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <h2 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center gap-3">
                <Users className="text-cyan-400" size={20} />
                AVAILABLE ROOMS
                <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded text-xs font-mono border border-cyan-500/30">
                  {filteredRooms.length}
                </span>
              </h2>
              
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                <input
                  suppressHydrationWarning
                  type="text"
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-2">
            {filteredRooms.length === 0 ? (
              <div className="py-12 text-center">
                <div className="inline-block p-4 rounded-full bg-white/5 mb-4">
                   <Search size={32} className="text-gray-600" />
                </div>
                <p className="text-gray-400 text-sm">No rooms found</p>
                <p className="text-gray-600 text-xs mt-1">Try creating one instead!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
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
                    joinRoomFunc={() => joinRoom(room.roomId, avatarUrl, userName)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close avatar picker */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-40" onClick={() => setShowAvatarPicker(false)} />
      )}

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-cyan-500/30 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(34,211,238,0.15)] relative overflow-hidden">
            {/* Modal Glow Effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400"></div>

            <h2 className="text-2xl font-black text-white mb-6 tracking-tight flex items-center gap-2">
              <span className="text-cyan-400">🎮</span> CREATE ROOM
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-gray-400 mb-2 text-xs font-bold uppercase tracking-wider">Room Name</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name..."
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-colors text-sm"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 mb-2 text-xs font-bold uppercase tracking-wider">Password (Optional)</label>
                <input
                  type="password"
                  value={newRoomPassword}
                  onChange={(e) => setNewRoomPassword(e.target.value)}
                  placeholder="Leave empty for public..."
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50 transition-colors text-sm"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 mb-2 text-xs font-bold uppercase tracking-wider">Max Players</label>
                <select
                  value={newRoomMaxPlayers}
                  onChange={(e) => setNewRoomMaxPlayers(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-colors text-sm appearance-none"
                >
                  {[2,3,4,5,6,7,8].map(num => (
                    <option key={num} value={num} className="bg-gray-900">{num} Players</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowCreateRoom(false)}
                className="flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createRoom}
                disabled={!newRoomName.trim()}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-3 rounded-lg text-sm font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:shadow-none transition-all"
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