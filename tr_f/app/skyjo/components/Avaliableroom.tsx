"use client";

import { useState } from "react";
import { Lock, Clock, Crown, Users, Play, Eye, EyeOff, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface AvailableRoomProps {
    player_name: string;
    Password_: string;
    room_status: string;
    room_host: string;
    room_players: string[];
    room_maxPlayers: number;
    room_name: string;
    room_id: string;
    joinRoomFunc: (roomId: string) => void;
}

export default function AvailableRoom({ 
    player_name, 
    Password_, 
    room_status, 
    room_host, 
    room_players, 
    room_maxPlayers, 
    room_name, 
    room_id ,
    joinRoomFunc,
}: AvailableRoomProps) {
    const router = useRouter();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const joinRoom = (enteredPassword = '') => {
        setError('');
        if (!player_name.trim()) { setError('Please enter your name first!'); return; }
        if (room_players.length >= room_maxPlayers) { setError('Room is full!'); return; }
        if (room_status === 'playing') { setError('Game in progress!'); return; }
        if (Password_ && Password_ !== enteredPassword) { setError('Incorrect password!'); return; }
        if (room_players.includes(player_name)) { setError('Name already in room!'); return; }
        
        setShowPasswordModal(false);
        setPassword('');
        joinRoomFunc(room_id);
        router.push(`/skyjo/room`);
    };

    const handleJoinClick = () => {
        if (Password_) {
            setShowPasswordModal(true);
            setError('');
        } else {
            joinRoom();
        }
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        joinRoom(password);
    };

    const PasswordModal = () => {
        if (!showPasswordModal) return null;
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-gray-900 border border-purple-500/30 p-8 rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.2)] max-w-sm w-full mx-4">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-white font-bold uppercase tracking-wider flex items-center gap-2">
                            <Lock size={18} className="text-purple-400" />
                            Private Room
                        </h3>
                        <button onClick={() => setShowPasswordModal(false)} className="text-gray-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <form onSubmit={handlePasswordSubmit}>
                        <div className="relative mb-6">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter room password..."
                                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-xs mb-4 text-center">
                                {error}
                            </div>
                        )}
                        
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowPasswordModal(false)}
                                className="flex-1 px-4 py-2 bg-transparent text-gray-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!password.trim()}
                                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold uppercase tracking-wider shadow-lg shadow-purple-500/20 transition-all"
                            >
                                Join
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="group relative bg-gray-800/40 border border-white/5 hover:border-cyan-500/30 hover:bg-gray-800/60 rounded-xl p-4 transition-all duration-300">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded text-[10px] font-mono">
                                ID: {room_id}
                            </span>
                            <h3 className="text-white font-bold text-lg tracking-tight group-hover:text-cyan-400 transition-colors">
                                {room_name}
                            </h3>
                            {Password_?.trim() && (
                                <Lock size={14} className="text-purple-400" />
                            )}
                        </div>
                    
                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                            <div className="flex items-center gap-1.5">
                                <Crown size={12} className="text-yellow-500" />
                                <span className="font-medium text-gray-300">{room_host}</span>
                            </div>
                            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                            <div className="flex items-center gap-1.5">
                                <Users size={12} className="text-blue-400" />
                                <span>{room_players?.length || 0} / {room_maxPlayers}</span>
                            </div>
                            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                room_status === 'waiting' 
                                    ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                                    : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                            }`}>
                                {room_status === 'waiting' ? 'Waiting' : 'Playing'}
                            </div>
                        </div>

                        {/* Player Pills */}
                        <div className="flex gap-2 flex-wrap">
                            {room_players?.map((player, index) => (
                                <div key={index} className="bg-black/30 border border-white/5 text-gray-300 px-2 py-0.5 rounded text-[10px]">
                                    {player}
                                </div>
                            )) || []}
                        </div>

                        {error && !Password_.trim() && (
                            <div className="mt-3 text-red-400 text-xs font-medium">
                                • {error}
                            </div>
                        )}
                    </div>
                        
                    <button
                        onClick={handleJoinClick}
                        disabled={room_players?.length >= room_maxPlayers || room_status === 'playing'}
                        className="ml-4 pl-4 border-l border-white/10 flex items-center"
                    >
                        <div className={`
                            px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all duration-200
                            ${room_status === 'playing' || room_players?.length >= room_maxPlayers
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-white shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                            }
                        `}>
                            {room_status === 'playing' ? 'Active' : 
                             room_players?.length >= room_maxPlayers ? 'Full' : (
                                <>
                                   JOIN <Play size={10} className="fill-current" />
                                </>
                             )}
                        </div>
                    </button>
                </div>
            </div>
            
            <PasswordModal />
        </>
    );
}