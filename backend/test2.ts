import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import cors from '@fastify/cors';
////////////
import { 
  GameRoom, 
  GameState, 
  Player, 
  gameRooms, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PADDLE_WIDTH, 
  PADDLE_HEIGHT, 
  BALL_SIZE, 
  BALL_SPEED,
  c_WIN,
  PADDLE_SPEED,
  waitingPlayers,
  COUNTDOWN_TIME
} from './ts/types';


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
// gameLogic.ts - Game logic functions
///////////////////////////////////////////////////////////////////////////

import { handlePlayerJoin } from './ts/handlePlayerJoin';
import { handlePlayerDisconnect } from './ts/handlePlayerDisconnect';
import { handlePaddleMove } from './ts/handlePaddleMove';

////////////////////////////////////////////////////////////////////////////









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
            handlePaddleMove(playerId, data.direction);
            break;

          case 'paddleMove3D':
            handlePaddleMove_3D(playerId, data.direction);
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
const handlePaddleMove_3D = (playerId: string, direction: number) => {
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

  // 🔧 FIX: Actually update the player's paddle position
  player.paddleY = direction;
  
  // Also update in the gameState players map if it exists there
  if (playerRoom.gameState.players.has(playerId)) {
    playerRoom.gameState.players.get(playerId)!.paddleY = direction;
  }

  console.log(`Player ${playerId} moved paddle to position: ${direction}`);

  // Now broadcast the updated game state
  broadcastGameState_3D(playerRoom);
}

// Also, make sure your broadcastGameState_3D function is getting the updated data
export const broadcastGameState_3D = (room: GameRoom) => {
 room.gameState.players.forEach(player => {
   try {
     const gameData = {
       type: 'gameState_3D',
       gameState: {
         ballX: 0,
         ballY: 0,
         gameRunning: room.gameState.gameRunning,
         players: Array.from(room.gameState.players.values()).map(p => ({
           id: p.id,
           paddleY: p.paddleY, // This should now have the updated position
           score: p.score,
           playerIndex: p.playerIndex
         }))
       },
       yourPlayerIndex: player.playerIndex
     };
     
     console.log(`Broadcasting to player ${player.id}: paddleY = ${player.paddleY}`);
     player.socket.send(JSON.stringify(gameData));
   } catch (error) {
     console.error('Error sending to player:', error);
   }
 });
};



















