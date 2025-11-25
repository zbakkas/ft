"use client";

import { useState } from "react";
import { Lock, Clock, Crown, Plus, Search, Users, Play, Eye, EyeOff, X } from "lucide-react";
import { useRouter } from "next/navigation";

// Fix: Destructure the props object properly
interface AvailableRoomProps {
    player_name: string;
    Password_: string;
    room_status: string;
    room_host: string;
    room_players: string[];
    room_maxPlayers: number;
    room_name: string;
    room_id: string;
    joinRoomFunc: (roomId: string) => void; // Optional function prop
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
    console.log("room_status:", room_status);

    // Join room function
    const joinRoom = (enteredPassword = '') => {
        setError(''); // Clear previous errors

        // Validate player name
        if (!player_name.trim()) {
            setError('Please enter your name first!');
            return;
        }
        
        // Check if room is full
        if (room_players.length >= room_maxPlayers) {
            setError('Room is full! Cannot join.');
            return;
        }

        // Check if game is already playing
        if (room_status === 'playing') {
            setError('Game is already in progress!');
            return;
        }
        
        // Validate password if required
        if (Password_ && Password_ !== enteredPassword) {
            setError('Incorrect password! Please try again.');
            return;
        }
        //ther same name in the room
        if(room_players.includes(player_name)){
            setError('the name are already in the room!');
            return;
        }
        
        // Success - join the room
        setShowPasswordModal(false);
        setPassword('');
        joinRoomFunc(room_id);
        router.push(`/room`);
    };

    // Handle join button click
    const handleJoinClick = () => {
        if (Password_) {
            setShowPasswordModal(true);
            setError('');
        } else {
            joinRoom();
        }
    };

    // Handle password form submission
    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        joinRoom(password);
    };

    // Password Modal Component
    const PasswordModal = () => {
        if (!showPasswordModal) return null;

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 max-w-sm w-full mx-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <Lock size={16} className="text-yellow-400" />
                            Password Required
                        </h3>
                        <button
                            onClick={() => {
                                setShowPasswordModal(false);
                                setPassword('');
                                setError('');
                            }}
                            className="text-gray-400 hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-4">
                        Enter the password to join "{room_name}"
                    </p>
                    
                    <form onSubmit={handlePasswordSubmit}>
                        <div className="relative mb-4">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password..."
                                className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        
                        {error && (
                            <div className="bg-red-500/20 border border-red-500 text-red-300 px-3 py-2 rounded-lg text-sm mb-4">
                                {error}
                            </div>
                        )}
                        
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setPassword('');
                                    setError('');
                                }}
                                className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!password.trim()}
                                className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Join Room
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="p-3 hover:bg-white/5 transition-all duration-200">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded font-mono text-xs">
                                #{room_id}
                            </span>
                            <h3 className="text-white font-semibold text-sm">{room_name}</h3>
                            {Password_?.trim() && (
                                <Lock size={12} className="text-yellow-400" />
                            )}
                            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                room_status === 'waiting' 
                                    ? 'bg-green-500/20 text-green-300' 
                                    : 'bg-orange-500/20 text-orange-300'
                            }`}>
                                {room_status === 'waiting' ? '🟢 Open' : '🟡 Playing'}
                            </div>
                        </div>
                    
                        <div className="flex items-center gap-3 text-blue-200 text-xs mb-1">
                            <div className="flex items-center gap-1">
                                <Crown size={10} />
                                <span>{room_host}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Users size={10} />
                                <span>{room_players?.length || 0}/{room_maxPlayers}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock size={10} />
                                {/* <span>{formatTime(room.createdAt)}</span> */}
                            </div>
                        </div>

                        <div className="flex gap-1 flex-wrap">
                            {room_players?.map((player, index) => (
                                <div key={index} className="bg-white/20 text-white px-2 py-0.5 rounded text-xs">
                                    {player}
                                </div>
                            )) || []}
                        </div>

                        {/* Display error message if any */}
                        {error &&  !Password_.trim()&&(
                            <div className="mt-2 bg-red-500/20 border border-red-500 text-red-300 px-2 py-1 rounded text-xs">
                                {error}
                            </div>
                        )}
                    </div>
                        
                    <button
                        onClick={handleJoinClick}
                        disabled={room_players?.length >= room_maxPlayers || room_status === 'playing'}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 flex items-center gap-1 ml-3"
                    >
                        <Play size={12} />
                        {room_status === 'playing' ? 'Playing' : 
                         room_players?.length >= room_maxPlayers ? 'Full' : 'Join'}
                    </button>
                </div>
            </div>
            
            {/* Password Modal */}
            <PasswordModal />
        </>
    );
}