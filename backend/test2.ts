import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import cors from '@fastify/cors';
////////////



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



















