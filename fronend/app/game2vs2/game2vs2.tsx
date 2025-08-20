'use client';
import { useRef, useState, useEffect, useCallback } from 'react';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 15;
const PADDLE_SPEED = 5;
const BALL_SPEED =6;
const COUNTDOWN_TIME = 5; // Countdown time in seconds


export default function Game2vs2() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const playerIdRef = useRef<string | null>(null);

  const [roomId, setRoomId] = useState<string | null>(null);
  const [messagee, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  

  // Paddle state
  const [P_me_paddleY, setP_me_PaddleY] = useState<number>(200); // Starting position
  const [P_2_paddleY, setP_2_PaddleY] = useState<number>(200); // Starting position
  const keysRef = useRef<Set<string>>(new Set());
  const [player_N, setPlayer_N] = useState<number | null>(null);
  const player_n_ref = useRef<number | null>(null);
  const [gameRunning, setGameRunning] = useState<boolean>(false);
  const [openTheGame, setopenTheGame] = useState<boolean>(false);
  const lastPaddleMove = useRef<{ direction: string; time: number } | null>(null);

  //BALL state
  const [ballX, setBallX] = useState<number>(CANVAS_WIDTH / 2);
  const [ballY, setBallY] = useState<number>(CANVAS_HEIGHT / 2);

  // Scores
  const [myScore, setMyScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);

  //gameover
  const [gameOver, setGameOver] = useState< string |boolean>(false);




  const connectToServer = () => 
  {
    if (connectionStatus === 'connected') {
      // If already connected, disconnect
      if (wsRef.current) {
        wsRef.current.close();
      }
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL_2V2 || 'ws://localhost:3001/2v2';
    console.log('Attempting to connect to:', wsUrl);

    setConnectionStatus('connecting');

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Connected to WebSocket');
      setConnectionStatus('connected');
      setIsLoading(true);
    };

    ws.onmessage = (event) => {
      console.log('📨 Received message from server:', event.data);

      try {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('❌ WebSocket disconnected', event.code, event.reason);
      setConnectionStatus('disconnected');
      setPlayerId(null);
      setMessage(null);
      wsRef.current = null;
      setRoomId(null);
      setPlayer_N(null);
      setIsLoading(false);
      setGameRunning(false);
      setopenTheGame(false);
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setConnectionStatus('disconnected');
      wsRef.current = null;
    };
  };


  
  const handleServerMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'matchFound':
        setMessage(data.message);
        setRoomId(data.gameId);
        setIsLoading(false);
        setPlayer_N(data.playerIndex + 1);
        player_n_ref.current = data.playerIndex + 1;
        setopenTheGame(true);
        console.log(`Match found! Room ID: ${data}`);

        if (data.players) {
          const myPlayer = data.players.find((p: any) => p.playerIndex === 0 || p.playerIndex === 1);
          const opponent = data.players.find((p: any) => p.playerIndex === 2 || p.playerIndex === 3);
          
          if (player_n_ref.current !== null && (player_n_ref.current  === 1 || player_n_ref.current  === 2) ) setP_me_PaddleY(myPlayer.paddleY);
          if (player_n_ref.current !== null &&(player_n_ref.current  === 4|| player_n_ref.current  === 3)) setP_2_PaddleY(opponent.paddleY);
          console.log('Game state updated:', { myPlayer, opponent });
        }
        break;
      case 'opponentDisconnected':
        // setMessage(data.message);
        setGameOver(data.message);
        setIsLoading(false);
        // setRoomId(null);
        setGameRunning(false);
        // setopenTheGame(false);
        console.log('Opponent disconnected:', data.message);
        break;
      case 'gameStarted':
        setMessage(data.message);
        setIsLoading(false);
        setGameRunning(true);
        console.log('Game started:', data.message);
        break;
      case 'waitingForOpponent':
        setMessage(data.message);
        console.log(`Waiting for opponent: ${data.message}`);
        break;
      case 'playerId':
          playerIdRef.current = data.playerId; // ✅ instant availability
          setPlayerId(data.playerId);          // ✅ triggers re-render for UI
          console.log(`🎮 Your player ID in B: ${playerId}`);
          console.log(`🎮 Your player ID in S: ${data.playerId}`);
        break;
      case 'gameState':
        const myId = playerIdRef.current;
        if (!myId) return; // now this will work after first message
        let xxIsFirst =false;
        if (data.gameState?.players) 
        {
          const myPlayer = data.gameState.players.find((p: any) => p.id === myId);
          if(myPlayer && myPlayer.playerIndex=== 0 || myPlayer.playerIndex === 1) 
          {
            xxIsFirst = true;
          }
          
          const opponent = xxIsFirst ? data.gameState.players.find((p: any) => p.playerIndex === 2 || p.playerIndex === 3): data.gameState.players.find((p: any) => p.playerIndex === 1 || p.playerIndex === 0);
        //   const opponent = data.gameState.players.find((p: any) => p.id !== myId);
        
        
        //   const myPlayer = data.gameState.players.find((p: any) => p.playerIndex === 0 || p.playerIndex === 1);
        //   const opponent = data.gameState.players.find((p: any) => p.playerIndex === 2 || p.playerIndex === 3);
      
          if (myPlayer)
          {
            setP_me_PaddleY(myPlayer.paddleY);
            setMyScore(myPlayer.score);
          } 
          if (opponent) 
          {
            setP_2_PaddleY(opponent.paddleY);
            setOpponentScore(opponent.score);
          }
        }
        setBallX(data.gameState.ballX);
        setBallY(data.gameState.ballY);
        break;
      case 'gameOver':
        setGameOver(data.message);
        setIsLoading(false);
        setGameRunning(false);
        console.log('Game Over:', data.message);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }, [playerId]);

  

  // Send paddle movement to server (with throttling)
  const sendPaddleMove = useCallback((direction: 'up' | 'down') => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const now = Date.now();
    if (lastPaddleMove.current && 
        lastPaddleMove.current.direction === direction && 
        now - lastPaddleMove.current.time < 16) { // ~60fps throttling
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'paddleMove2vs2',
      direction,
    }));

    lastPaddleMove.current = { direction, time: now };
  }, []);

  

  // Handle continuous key presses
  useEffect(() => {
    const handleMovement = () => {
    if (player_n_ref.current && player_n_ref.current % 2 ==0&& (keysRef.current.has('w') || keysRef.current.has('ArrowUp'))) {
        sendPaddleMove('up');
      }
      if (player_n_ref.current && player_n_ref.current % 2 !=0 &&(keysRef.current.has('s') || keysRef.current.has('ArrowDown'))) {
        sendPaddleMove('down');
      }
    };

    const intervalId = setInterval(handleMovement, 16); // ~60fps

    return () => clearInterval(intervalId);
  }, [sendPaddleMove]);

  // Keyboard event handlers
  useEffect(() => 
  {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 's' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        keysRef.current.add(e.key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    connectToServer();
    if( wsRef.current ) 
    {
        wsRef.current.onopen = () => 
        {
            wsRef.current?.send(JSON.stringify(
            {
                type: 'gameType', 
                game:'2vs2'
            }));
        };
    }
  }, []);

  const disconnectFromServer = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setConnectionStatus('disconnected');
      setPlayerId(null);
      setMessage(null);
      setRoomId(null);
      setIsLoading(false);
      setPlayer_N(null);
      setGameRunning(false);
      setopenTheGame(false);
    }
  };


  return (
    <div>

    <h1> you are {connectionStatus} </h1>
      {messagee && <h2>{messagee}</h2>}
      {playerId && <h2>Player ID: {playerId}</h2>}
      


      {isLoading && (
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      )}
      {roomId && <h2>Room ID: {roomId}</h2>}
      {connectionStatus === 'connected' && (
        <button onClick={disconnectFromServer}>disconnected</button>
      )}
        {player_N && <h2>Player N: {player_N}</h2>}
        {player_N && <h2> your move {player_N%2===0?"up":"down"} </h2>}

            {/* Game Area with Paddle */}
      {true && (
        <div
          className=" relative bg-black border border-white rotate-0 items-center justify-center  m-auto"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          
        >
          {/* Left Paddle (Your paddle) */}
          <div
            className="absolute bg-green-400"
            style={{
              left: '0px',
              top: `${P_me_paddleY}px`,
              width: `${PADDLE_WIDTH}px`,
              height: `${PADDLE_HEIGHT}px`,
            }}
          />
          {/* Right Paddle (Opponent paddle) */}
          <div
            className="absolute bg-white"
            style={{
              left: `${CANVAS_WIDTH - PADDLE_WIDTH - 0}px`,
              top: `${P_2_paddleY}px`,
              width: `${PADDLE_WIDTH}px`,
              height: `${PADDLE_HEIGHT}px`,
            }}
          />

           {/* Ball */}
           {!gameOver &&
          <div
            className="absolute bg-red-500 rounded-full z-1"
            style={{
              left: `${(ballX - BALL_SIZE / 2)}px`,
              top: `${(ballY - BALL_SIZE / 2)}px`,
              width: `${BALL_SIZE}px`,
              height: `${BALL_SIZE}px`,
            }}
          />
          }

         {/* Scores */}
        <div className="absolute  w-full   flex justify-between pt-5 px-50  items-center text-xl font-bold text-white">
          <div> {myScore}</div>
          <div> {opponentScore}</div>
        </div>

        {/* Add this to your JSX, inside the game area div where you want to display the countdown */}
        {/* {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center ">
            <div className="text-9xl font-bold text-white/90 px-8 py-4 rounded-lg z-4">
            {countdown}
            </div>
            </div>
        )} */}
        {gameOver && (
          <h1 className='absolute font-bold text-6xl text-center z-4 inset-0 flex items-center justify-center'>{gameOver}</h1>
        )}

   {/* Center Line */}
    <div
      className="absolute h-full left-1/2 transform -translate-x-1/2 border-l-2 border-gray-400 border-dashed"
    />
        
        </div>
      )}



      
    </div>
  );
}