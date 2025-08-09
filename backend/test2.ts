import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import cors from '@fastify/cors';


const fastify = Fastify({ logger: true });

// Register plugins
fastify.register(cors, {
  origin: true,
  credentials: true
});

fastify.register(fastifyWebsocket);

fastify.get('/', async (req, reply) => {
  return 'WebSocket server is running';
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🎮 Pong server running on http://localhost:3001');
    console.log('🚀 WebSocket endpoint: ws://localhost:3001/ws');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
//////////////////////////////////////////

interface Player {
  id: string;
  name: string;
  score: number;
  playerIndex: number; // 0 for player 1, 1 for player 2
  paddleY: number; // Optional for player 1
  socket: any;
}
interface GameState {
  players: Map<string, Player>;
  gameRunning: boolean;
  gameId: string;
}

interface GameRoom {
  id: string;
  gameState: GameState;
  players: Map<string, Player>;
  gameLoop?: NodeJS.Timeout;
}

// Store active game rooms
const gameRooms = new Map<string, GameRoom>();
const waitingPlayers: Array<{ playerId: string; socket: any }> = [];

// Generate unique game ID
const generateGameId = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Matchmaking system - automatically pair players
const handlePlayerJoin = (connection: any, playerId: string) => {
  console.log(`Player ${playerId} looking for match...`);
  

  connection.socket.send(JSON.stringify({
    type: 'playerId',
    message: 'playerId is ' + playerId,
    playerId: playerId
  }));

  // Check if there's a waiting player
  if (waitingPlayers.length > 0) 
  {
    // Match with waiting player
    const waitingPlayer = waitingPlayers.shift()!;
    createGameForTwoPlayers(waitingPlayer, { playerId, socket: connection.socket });
    
  } 
  else 
  {
    // Add to waiting list
    waitingPlayers.push({ playerId, socket: connection.socket });
    
    // Notify player they're waiting
    connection.socket.send(JSON.stringify({
      type: 'waitingForOpponent',
      message: 'Waiting for an opponent...',
      waitingPlayers: waitingPlayers.length
    }));
    
    console.log(`Player ${playerId} added to waiting list. Total waiting: ${waitingPlayers.length}`);
  }
};

// Create a new game for two matched players
const createGameForTwoPlayers = (player1: { playerId: string; socket: any }, player2: { playerId: string; socket: any }) => {
  const gameId = generateGameId();
  
  const room: GameRoom = {
    id: gameId,
    gameState: createGameState(gameId),
    players: new Map(),
  };

  // Create player objects
  const gamePlayer1: Player = {
    id: player1.playerId,
    name: "Player 11",
    score: 0,
    playerIndex: 0,
    paddleY: 0, // Initial position for player 1
    socket: player1.socket
  };

  const gamePlayer2: Player = {
    id: player2.playerId,
    name: "Player 22",
    score: 0,
    playerIndex: 1,
    paddleY:0,
    socket: player2.socket
  };

  // Add players to room
  room.players.set(player1.playerId, gamePlayer1);
  room.players.set(player2.playerId, gamePlayer2);
  room.gameState.players.set(player1.playerId, gamePlayer1);
  room.gameState.players.set(player2.playerId, gamePlayer2);

  // Store room
  gameRooms.set(gameId, room);

  // Notify both players they're matched
  const gameStateData = {
    
    gameRunning: room.gameState.gameRunning,
    players: Array.from(room.gameState.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      playerIndex: p.playerIndex
    }))
  };

  // Send to player 1
  player1.socket.send(JSON.stringify({
    type: 'matchFound',
    playerId: player1.playerId,
    playerIndex: 0,
    gameId: gameId,
    gameState: gameStateData,
    message: 'Match found! You are Player 1'
  }));

  // Send to player 2
  player2.socket.send(JSON.stringify({
    type: 'matchFound',
    playerId: player2.playerId,
    playerIndex: 1,
    gameId: gameId,
    gameState: gameStateData,
    message: 'Match found! You are Player 2'
  }));

  console.log(`Game created: ${gameId} - Player1: ${player1.playerId}, Player2: ${player2.playerId}`);
  
  // Auto-start the game after a brief delay
  setTimeout(() => {
    room.gameState.gameRunning = true;
    // startGameLoop(room);
    // broadcastGameState(room);
    
    room.players.forEach(player => {
      player.socket.send(JSON.stringify({
        type: 'gameStarted',
        message: 'Game started! Use W/S or Arrow keys to move your paddle.'
      }));
    });
  }, 2000); // 2 second delay before auto-start
};

// Create initial game state
const createGameState = (gameId: string): GameState => ({

  players: new Map(),
  gameRunning: false,
  gameId
});


// WebSocket route
fastify.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    const playerId = Math.random().toString(36).substring(7);
    console.log(`Player ${playerId} connected`);

    // Automatically start matchmaking when player connects
    handlePlayerJoin(connection, playerId);

    connection.socket.on('message', (message: { toString: () => string; }) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'paddleMove':
            handlePaddleMove(playerId, data.direction,data.gameHeight,data.paddleHeight,data.PADDLE_SPEED);
            break;
            
          case 'startGame':
            handleStartGame(playerId);
            break;
            
          case 'pauseGame':
            handlePauseGame(playerId);
            break;
            
          case 'resetGame':
            handleResetGame(playerId);
            break;
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    connection.socket.on('close', () => {
      handlePlayerDisconnect(playerId);
    });
  });
});


// UPDATE the handlePaddleMove function
const handlePaddleMove = (playerId: string, direction: 'up' | 'down' ,gameHeight :number ,paddleHeight:number ,PADDLE_SPEED:number) => {
  const room = findRoomByPlayerId(playerId);
  if (!room || !room.gameState.gameRunning) return;

  const player = room.players.get(playerId);
  if (!player) return;

  // Validate paddle position (prevent cheating)
  // const gameHeight = 400;
  // const paddleHeight = 180;
  // const clampedPaddleY = Math.max(0, Math.min(gameHeight - paddleHeight, paddleY));


  // Update paddle position
  let clampedPaddleY = player.paddleY;
  if (direction === 'up' && player.paddleY > 0) {
    clampedPaddleY = Math.max(0, player.paddleY - PADDLE_SPEED);
  } else if (direction === 'down' && player.paddleY < gameHeight - paddleHeight) {
    clampedPaddleY = Math.min(gameHeight - paddleHeight, player.paddleY + PADDLE_SPEED);
  }

  // Update player's paddleY
  player.paddleY = clampedPaddleY;

  // Broadcast paddle position to other players in the room
  room.players.forEach(p => {
    if (p.id !== playerId) 
    { // Don't send back to the sender
      p.socket.send(JSON.stringify({
        type: 'paddleUpdate',
        playerId: playerId,
        paddleY: clampedPaddleY,
        timestamp: Date.now()
      }));
    }
  });

  // Optional: Log for debugging
  console.log(`Player ${playerId} moved paddle to ${clampedPaddleY}`);
};


const handlePlayerDisconnect = (playerId: string) => {
  console.log(`Player ${playerId} disconnecting...`);
  
  // Remove from waiting list if present
  const waitingIndex = waitingPlayers.findIndex(p => p.playerId === playerId);
  if (waitingIndex !== -1) {
    waitingPlayers.splice(waitingIndex, 1);
    console.log(`Removed ${playerId} from waiting list. Waiting players: ${waitingPlayers.length}`);
    return;
  }

  // Remove from active game
  const room = findRoomByPlayerId(playerId);
  if (!room) return;

  room.players.delete(playerId);
  room.gameState.players.delete(playerId);
  
  // Stop game if a player disconnects
  room.gameState.gameRunning = false;
  stopGameLoop(room);

  // Notify remaining player and add them back to waiting list
  room.players.forEach(player => {
    player.socket.send(JSON.stringify({
      type: 'opponentDisconnected',
      message: 'Your opponent disconnected. Looking for a new match...'
    }));
    
    // Add remaining player back to waiting list
    waitingPlayers.push({ playerId: player.id, socket: player.socket });
    
    player.socket.send(JSON.stringify({
      type: 'waitingForOpponent',
      message: 'Waiting for a new opponent...',
      waitingPlayers: waitingPlayers.length
    }));
  });

  // Remove empty rooms
  if (room.players.size === 0) {
    gameRooms.delete(room.id);
  }

  console.log(`Player ${playerId} disconnected. Active games: ${gameRooms.size}, Waiting: ${waitingPlayers.length}`);
};

const findRoomByPlayerId = (playerId: string): GameRoom | undefined => {
  for (const room of gameRooms.values()) {
    if (room.players.has(playerId)) {
      return room;
    }
  }
  return undefined;
};
// Stop game loop for a room
const stopGameLoop = (room: GameRoom) => {
  if (room.gameLoop) {
    clearInterval(room.gameLoop);
    room.gameLoop = undefined;
  }
};