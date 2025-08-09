'use client';
import { useRef, useState } from 'react';

export default function MultiplayerPongGame_test() 
{
  const wsRef = useRef<WebSocket | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const connectToServer = () => 
  {
    if (connectionStatus === 'connected') {
      // If already connected, disconnect
      if (wsRef.current) {
        wsRef.current.close();
      }
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
    console.log('Attempting to connect to:', wsUrl);
    
    setConnectionStatus('connecting');
    setLogs((prev) => [...prev, `🔄 Connecting to ${wsUrl}...`]);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Connected to WebSocket');
      setConnectionStatus('connected');
      setLogs((prev) => [...prev, '✅ Connected to server']);
    };

    ws.onmessage = (event) => {
      console.log('📨 Received message from server:', event.data);
      
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'playerClicked') {
          setLogs((prev) => [...prev, '🔔 Another player clicked!']);
        }

        if (data.type === 'playerId') {
          setPlayerId(data.playerId);
          setLogs((prev) => [...prev, `🎮 Your player ID: ${data.playerId}`]);
        }
      } catch (error) {
        console.error('❌Error parsing message:', error);
        setLogs((prev) => [...prev, '❌ Error parsing server message']);
      }
    };

    ws.onclose = (event) => {
      console.log('❌ WebSocket disconnected', event.code, event.reason);
      setConnectionStatus('disconnected');
      setPlayerId(null);
      setLogs((prev) => [...prev, `❌ Disconnected from server (${event.code})`]);
      wsRef.current = null;
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setConnectionStatus('disconnected');
      setLogs((prev) => [...prev, '❌ Connection error - make sure server is running']);
      wsRef.current = null;
    };
  };

  const sendMessage = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: 'playerClicked',
        playerId: playerId,
        timestamp: Date.now()
      }));
      setLogs((prev) => [...prev, '📤 Sent click event to other players']);
    } else {
      setLogs((prev) => [...prev, '❌ Not connected to server']);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'disconnected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConnectButtonText = () => 
    {
    switch (connectionStatus) {
      case 'connected': return 'Disconnect';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Connect to Server';
      default: return 'Connect';
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Simple Multiplayer Connect</h1>

      <div className="mb-4 p-3 bg-gray-100 rounded">
        <p className={`font-mono text-sm ${getStatusColor()}`}>
          Status: {connectionStatus.toUpperCase()}
        </p>
        {playerId && (
          <p className="text-green-600 font-mono text-sm">
            Player ID: <strong>{playerId}</strong>
          </p>
        )}
      </div>

      <div className="space-y-3">
        <button
          onClick={connectToServer}
          disabled={connectionStatus === 'connecting'}
          className={`px-4 py-2 rounded font-medium w-full ${
            connectionStatus === 'connected'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : connectionStatus === 'connecting'
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {getConnectButtonText()}
        </button>

        {connectionStatus === 'connected' && (
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 w-full"
          >
            Send Message to Other Players
          </button>
        )}
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Connection Logs:</h3>
        <div className="bg-black text-green-400 p-3 rounded font-mono text-sm max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            logs.map((log, idx) => (
              <p key={idx} className="mb-1">{log}</p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}