'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getGatewayUrl } from "@/lib/gateway";

interface Friend {
  id: string;
  username: string;
  avatarUrl: string;
}

export default function PrivateGameSetup() {
  const router = useRouter();
  // Current user (owner)
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  
  // Selected friend to invite
  const [invitedId, setInvitedId] = useState<string>('');
  const [invitedUsername, setInvitedUsername] = useState<string>('');
  
  // Room ID
  const [roomId, setRoomId] = useState<string>('');
  
  // Friends list
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState<boolean>(false);
  
  // Connection state
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch current user on mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Fetch friends when user is loaded
  useEffect(() => {
    if (currentUserId) {
      fetchFriends();
    }
  }, [currentUserId]);

  const fetchCurrentUser = async () => {
    setLoadingUser(true);
    try {
      // Fetch from user-mgmt/me endpoint (uses cookie authentication)
      const response = await fetch(getGatewayUrl("/api/v1/user-mgmt/me"), {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        // The API returns id and username
        setCurrentUserId(data.id?.toString() || data.userId?.toString() || '');
        setCurrentUsername(data.username || '');
        console.log('✅ Fetched current user:', data.username, 'ID:', data.id);
      } else {
        console.error('Failed to fetch user, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      // Adjust this endpoint to match your friends API
      const response = await fetch(getGatewayUrl(`/api/v1/user-mgmt/${currentUserId}/friends`), {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setFriends(data.map((friend: any) => ({
          id: friend.id,
          username: friend.username,
          avatarUrl: getGatewayUrl(`/api/v1/user-mgmt/@${friend.username}/avatar`)
        })));
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const generateRoomId = () => {
    const newRoomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    setRoomId(newRoomId);
  };

  const selectFriend = (friend: Friend) => {
    setInvitedId(friend.id);
    setInvitedUsername(friend.username);
  };

  const createPrivateRoom = () => {
    if (!currentUserId || !invitedId || !roomId) {
      alert('Please fill all fields: User ID, Invited Player, and Room ID');
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = `ws://localhost:3006/ws/private/create?userId=${currentUserId}&invitedId=${invitedId}&roomId=${roomId}`;
    
    setConnectionStatus('Connecting...');
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Connected to private game room');
      setIsConnected(true);
      setConnectionStatus(`Connected! Waiting for ${invitedUsername || invitedId} to join...`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received:', data);
        
        if (data.type === 'error') {
          setConnectionStatus(`Error: ${data.message}`);
        } else if (data.type === 'matchFound') {
          setConnectionStatus('Opponent joined! Redirecting to game...');
          // Redirect to game2d page after a short delay
          setTimeout(() => {
            router.push('/game2d');
          }, 1500);
        } else {
          setConnectionStatus(data.message || JSON.stringify(data));
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from server');
      setIsConnected(false);
      setConnectionStatus('Disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('Connection error');
      setIsConnected(false);
    };
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold text-white mb-6 text-center">
        🎮 Create Private Game
      </h1>

      {/* Current User Info */}
      <div className="mb-6 p-4 bg-gray-700 rounded-lg">
        <label className="block text-gray-300 text-sm font-bold mb-2">
          Your User ID
        </label>
        {loadingUser ? (
          <div className="flex items-center gap-2 p-3 bg-gray-600 rounded-lg">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span className="text-gray-400">Loading your profile...</span>
          </div>
        ) : (
          <>
            <input
              type="text"
              value={currentUserId}
              onChange={(e) => setCurrentUserId(e.target.value)}
              placeholder="Enter your user ID"
              className="w-full p-3 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
              readOnly
            />
            {currentUsername ? (
              <p className="text-green-400 mt-2">✅ Logged in as: <strong>{currentUsername}</strong></p>
            ) : (
              <p className="text-red-400 mt-2">❌ Not logged in. Please log in first.</p>
            )}
          </>
        )}
      </div>

      {/* Room ID */}
      <div className="mb-6 p-4 bg-gray-700 rounded-lg">
        <label className="block text-gray-300 text-sm font-bold mb-2">
          Room ID
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter or generate room ID"
            className="flex-1 p-3 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={generateRoomId}
            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Generate
          </button>
        </div>
      </div>

      {/* Select Player to Invite */}
      <div className="mb-6 p-4 bg-gray-700 rounded-lg">
        <label className="block text-gray-300 text-sm font-bold mb-2">
          Invite Player
        </label>
        
        {/* Manual Input */}
        <input
          type="text"
          value={invitedId}
          onChange={(e) => {
            setInvitedId(e.target.value);
            setInvitedUsername('');
          }}
          placeholder="Enter player ID to invite"
          className="w-full p-3 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none mb-4"
        />
        
        {invitedUsername && (
          <p className="text-blue-400 mb-4">Selected: {invitedUsername}</p>
        )}

        {/* Friends List */}
        <div className="mt-4">
          <p className="text-gray-400 text-sm mb-2">Or select from friends:</p>
          {loadingFriends ? (
            <p className="text-gray-500">Loading friends...</p>
          ) : friends.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => selectFriend(friend)}
                  className={`flex items-center gap-2 p-2 rounded-lg transition ${
                    invitedId === friend.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  <img
                    src={friend.avatarUrl}
                    alt={friend.username}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';
                    }}
                  />
                  <span className="truncate">{friend.username}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No friends found. Enter player ID manually.</p>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6 p-4 bg-gray-900 rounded-lg">
        <h3 className="text-white font-bold mb-2">Game Summary</h3>
        <ul className="text-gray-400 text-sm space-y-1">
          <li>👤 Owner: <span className="text-white">{currentUserId || 'Not set'}</span></li>
          <li>🎯 Invited: <span className="text-white">{invitedUsername || invitedId || 'Not set'}</span></li>
          <li>🏠 Room: <span className="text-white">{roomId || 'Not set'}</span></li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {!isConnected ? (
          <button
            onClick={createPrivateRoom}
            disabled={!currentUserId || !invitedId || !roomId}
            className={`flex-1 py-4 rounded-lg font-bold text-lg transition ${
              currentUserId && invitedId && roomId
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            🚀 Create Private Room
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="flex-1 py-4 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 transition"
          >
            ❌ Disconnect
          </button>
        )}
      </div>

      {/* Connection Status */}
      {connectionStatus && (
        <div className={`mt-4 p-4 rounded-lg text-center ${
          isConnected ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
        }`}>
          {connectionStatus}
        </div>
      )}
    </div>
  );
}
