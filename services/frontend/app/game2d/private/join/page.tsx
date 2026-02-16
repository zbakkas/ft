'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getGatewayUrl } from "@/lib/gateway";

export default function JoinPrivateGame() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get params from URL (if coming from invitation link)
  const urlRoomId = searchParams.get('roomId') || '';
  const urlOwnerId = searchParams.get('ownerId') || '';
  
  // Current user (invited player)
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  
  // Room info
  const [roomId, setRoomId] = useState<string>(urlRoomId);
  const [ownerId, setOwnerId] = useState<string>(urlOwnerId);
  
  // Connection state
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch current user on mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Update from URL params
  useEffect(() => {
    if (urlRoomId) setRoomId(urlRoomId);
    if (urlOwnerId) setOwnerId(urlOwnerId);
  }, [urlRoomId, urlOwnerId]);

  const fetchCurrentUser = async () => {
    setLoadingUser(true);
    try {
      const response = await fetch(getGatewayUrl("/api/v1/user-mgmt/me"), {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.id?.toString() || data.userId?.toString() || '');
        setCurrentUsername(data.username || '');
        console.log('✅ Fetched current user:', data.username, 'ID:', data.id);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    } finally {
      setLoadingUser(false);
    }
  };

  const joinPrivateRoom = () => {
    if (!currentUserId || !roomId) {
      alert('Please enter Room ID to join');
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Join endpoint: /ws/private/join?odaId=OWNER_ID&uigId=YOUR_ID&roomId=ROOM_ID
    const wsUrl = `ws://localhost:3006/ws/private/join?odaId=${ownerId}&uigId=${currentUserId}&roomId=${roomId}`;
    
    setConnectionStatus('Joining room...');
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Connected to private game room');
      setIsConnected(true);
      setConnectionStatus('Connected! Waiting for game to start...');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received:', data);
        
        if (data.type === 'error') {
          setConnectionStatus(`Error: ${data.message}`);
          setIsConnected(false);
        } else if (data.type === 'matchFound') {
          setGameStarted(true);
          setConnectionStatus(`Game starting! Redirecting to game...`);
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
      if (!gameStarted) {
        setConnectionStatus('Disconnected');
      }
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
    setGameStarted(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-xl mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          🎮 Join Private Game
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
                readOnly
                className="w-full p-3 bg-gray-600 text-white rounded-lg border border-gray-500"
              />
              {currentUsername ? (
                <p className="text-green-400 mt-2">✅ Logged in as: <strong>{currentUsername}</strong></p>
              ) : (
                <p className="text-red-400 mt-2">❌ Not logged in. Please log in first.</p>
              )}
            </>
          )}
        </div>

        {/* Owner ID (who invited you) */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Room Owner ID
          </label>
          <input
            type="text"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            placeholder="Enter the owner's user ID"
            className="w-full p-3 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Room ID */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Room ID
          </label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter the room ID from your invitation"
            className="w-full p-3 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {!isConnected ? (
            <button
              onClick={joinPrivateRoom}
              disabled={!currentUserId || !roomId}
              className={`flex-1 py-4 rounded-lg font-bold text-lg transition ${
                currentUserId && roomId
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              🚀 Join Game
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
            gameStarted ? 'bg-green-900 text-green-300' :
            isConnected ? 'bg-blue-900 text-blue-300' : 
            'bg-yellow-900 text-yellow-300'
          }`}>
            {connectionStatus}
          </div>
        )}

        {/* Link to create page */}
        <div className="mt-6 text-center">
          <a href="/game2d/private" className="text-blue-400 hover:text-blue-300 underline">
            Want to create a room instead?
          </a>
        </div>
      </div>
    </div>
  );
}
