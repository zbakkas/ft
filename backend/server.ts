// server/server.ts
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';

const fastify = Fastify({ logger: true });

// Register plugins
fastify.register(cors, {
  origin: true,
  credentials: true
});
fastify.register(websocket);

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;
const PADDLE_SPEED = 6;
const BALL_SPEED = 7;

interface Player {
  id: string;
  paddleY: number;
  score: number;
  playerIndex: number; // 0 for player 1, 1 for player 2
  socket: any;
}

interface GameState {
  ballX: number;
  ballY: number;
  ballVelocityX: number;
  ballVelocityY: number;
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

// Create initial game state
const createGameState = (gameId: string): GameState => ({
  ballX: CANVAS_WIDTH / 2,
  ballY: CANVAS_HEIGHT / 2,
  ballVelocityX: BALL_SPEED,
  ballVelocityY: BALL_SPEED,
  players: new Map(),
  gameRunning: false,
  gameId
});

// Update game physics
const updateGameState = (room: GameRoom) => {
  const { gameState } = room;
  
  if (!gameState.gameRunning) return;

  // Update ball position
  gameState.ballX += gameState.ballVelocityX;
  gameState.ballY += gameState.ballVelocityY;

  // Ball collision with top and bottom walls
  if (gameState.ballY <= 0 || gameState.ballY >= CANVAS_HEIGHT - BALL_SIZE) {
    gameState.ballVelocityY = -gameState.ballVelocityY;
  }

  const players = Array.from(gameState.players.values());
  const player1 = players.find(p => p.playerIndex === 0);
  const player2 = players.find(p => p.playerIndex === 1);

  if (player1 && player2) {
    // Ball collision with player 1 paddle (left side)
    if (
      gameState.ballX <= PADDLE_WIDTH &&
      gameState.ballY >= player1.paddleY &&
      gameState.ballY <= player1.paddleY + PADDLE_HEIGHT
    ) {
      gameState.ballVelocityX = Math.abs(gameState.ballVelocityX);
      const hitPos = (gameState.ballY - player1.paddleY) / PADDLE_HEIGHT;
      gameState.ballVelocityY = (hitPos - 0.5) * BALL_SPEED * 2;
    }

    // Ball collision with player 2 paddle (right side)
    if (
      gameState.ballX >= CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE &&
      gameState.ballY >= player2.paddleY &&
      gameState.ballY <= player2.paddleY + PADDLE_HEIGHT
    ) {
      gameState.ballVelocityX = -Math.abs(gameState.ballVelocityX);
      const hitPos = (gameState.ballY - player2.paddleY) / PADDLE_HEIGHT;
      gameState.ballVelocityY = (hitPos - 0.5) * BALL_SPEED * 2;
    }

    // Ball goes off left side (player 2 scores)
    if (gameState.ballX < 0) {
      player2.score++;
      resetBall(gameState);
    }

    // Ball goes off right side (player 1 scores)
    if (gameState.ballX > CANVAS_WIDTH) {
      player1.score++;
      resetBall(gameState);
    }
  }
};

const resetBall = (gameState: GameState) => {
  gameState.ballX = CANVAS_WIDTH / 2;
  gameState.ballY = CANVAS_HEIGHT / 2;
  gameState.ballVelocityX = (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED;
  gameState.ballVelocityY = (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED;
};

// Broadcast game state to each player with their perspective
const broadcastGameState = (room: GameRoom) => {
  room.gameState.players.forEach(player => {
    try {
      const gameData = {
        type: 'gameState',
        gameState: {
          ballX: room.gameState.ballX,
          ballY: room.gameState.ballY,
          gameRunning: room.gameState.gameRunning,
          players: Array.from(room.gameState.players.values()).map(p => ({
            id: p.id,
            paddleY: p.paddleY,
            score: p.score,
            playerIndex: p.playerIndex
          }))
        },
        yourPlayerIndex: player.playerIndex
      };

      player.socket.send(JSON.stringify(gameData));
    } catch (error) {
      console.error('Error sending to player:', error);
    }
  });
};

// Start game loop for a room
const startGameLoop = (room: GameRoom) => {
  if (room.gameLoop) {
    clearInterval(room.gameLoop);
  }

  room.gameLoop = setInterval(() => {
    updateGameState(room);
    broadcastGameState(room);
  }, 1000 / 60); // 60 FPS
};

// Stop game loop for a room
const stopGameLoop = (room: GameRoom) => {
  if (room.gameLoop) {
    clearInterval(room.gameLoop);
    room.gameLoop = undefined;
  }
};

// WebSocket route
fastify.register(async function (fastify)
{
  fastify.get('/ws', { websocket: true }, (connection, req) => 
  {
    const playerId = Math.random().toString(36).substring(7);
    console.log(`Player ${playerId} connected`);

    connection.socket.on('message', (message: { toString: () => string; }) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'joinGame':
            handleJoinGame(connection, playerId, data.gameId);
            break;
            
          case 'paddleMove':
            handlePaddleMove(playerId, data.direction);
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

const handleJoinGame = (connection: any, playerId: string, gameId: string) => {
  let room = gameRooms.get(gameId);
  
  if (!room) {
    // Create new room
    room = {
      id: gameId,
      gameState: createGameState(gameId),
      players: new Map(),
    };
    gameRooms.set(gameId, room);
  }

  if (room.players.size >= 2) {
    connection.socket.send(JSON.stringify({
      type: 'error',
      message: 'Game room is full'
    }));
    return;
  }

  // Determine player index (0 for first, 1 for second)
  const playerIndex = room.players.size;
  
  const player: Player = {
    id: playerId,
    paddleY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    score: 0,
    playerIndex,
    socket: connection.socket
  };

  room.players.set(playerId, player);
  room.gameState.players.set(playerId, player);

  // Send initial game state to new player
  connection.socket.send(JSON.stringify({
    type: 'playerJoined',
    playerId,
    playerIndex,
    gameState: {
      ballX: room.gameState.ballX,
      ballY: room.gameState.ballY,
      gameRunning: room.gameState.gameRunning,
      players: Array.from(room.gameState.players.values()).map(p => ({
        id: p.id,
        paddleY: p.paddleY,
        score: p.score,
        playerIndex: p.playerIndex
      }))
    },
    yourPlayerIndex: playerIndex
  }));

  // If room is full, notify all players
  if (room.players.size === 2) {
    broadcastGameState(room);
    room.players.forEach(p => {
      p.socket.send(JSON.stringify({
        type: 'roomReady',
        message: 'Both players connected. Game ready to start!'
      }));
    });
  }

  console.log(`Player ${playerId} joined room ${gameId} as player ${playerIndex + 1}`);
};

const handlePaddleMove = (playerId: string, direction: 'up' | 'down') => {
  // Find the room containing this player
  let playerRoom: GameRoom | undefined;
  let player: Player | undefined;

  for (const room of gameRooms.values()) {
    player = room.players.get(playerId);
    if (player) {
      playerRoom = room;
      break;
    }
  }

  if (!playerRoom || !player) return;

  // Update paddle position
  if (direction === 'up' && player.paddleY > 0) {
    player.paddleY = Math.max(0, player.paddleY - PADDLE_SPEED);
  } else if (direction === 'down' && player.paddleY < CANVAS_HEIGHT - PADDLE_HEIGHT) {
    player.paddleY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, player.paddleY + PADDLE_SPEED);
  }

  // Broadcast updated state
  broadcastGameState(playerRoom);
};

const handleStartGame = (playerId: string) => {
  const room = findRoomByPlayerId(playerId);
  if (!room || room.players.size < 2) return;

  room.gameState.gameRunning = true;
  startGameLoop(room);
  broadcastGameState(room);
};

const handlePauseGame = (playerId: string) => {
  const room = findRoomByPlayerId(playerId);
  if (!room) return;

  room.gameState.gameRunning = false;
  stopGameLoop(room);
  broadcastGameState(room);
};

const handleResetGame = (playerId: string) => {
  const room = findRoomByPlayerId(playerId);
  if (!room) return;

  stopGameLoop(room);
  
  // Reset game state but keep players
  const players = Array.from(room.gameState.players.values());
  room.gameState = createGameState(room.id);
  
  players.forEach(player => {
    player.paddleY = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    player.score = 0;
    room.gameState.players.set(player.id, player);
  });

  broadcastGameState(room);
};

const handlePlayerDisconnect = (playerId: string) => {
  const room = findRoomByPlayerId(playerId);
  if (!room) return;

  room.players.delete(playerId);
  room.gameState.players.delete(playerId);
  
  // Stop game if a player disconnects
  room.gameState.gameRunning = false;
  stopGameLoop(room);

  // Notify remaining player
  room.players.forEach(player => {
    player.socket.send(JSON.stringify({
      type: 'playerDisconnected',
      message: 'Other player disconnected'
    }));
  });

  // Remove empty rooms
  if (room.players.size === 0) {
    gameRooms.delete(room.id);
  }

  console.log(`Player ${playerId} disconnected`);
};

const findRoomByPlayerId = (playerId: string): GameRoom | undefined => {
  for (const room of gameRooms.values()) {
    if (room.players.has(playerId)) {
      return room;
    }
  }
  return undefined;
};

// Health check route
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', activeRooms: gameRooms.size };
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