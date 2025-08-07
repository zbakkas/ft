import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';

const fastify = Fastify({ logger: true });
fastify.register(fastifyWebsocket);

const clients = new Set<WebSocket>();

fastify.get('/', async (req, reply) => {
  return 'WebSocket server is running';
});

fastify.register(async function (fastify) 
{
  fastify.get('/ws', { websocket: true }, (connection, req) => 
    {
    const socket = connection.socket;
    clients.add(socket);

    const playerId = Math.random().toString(36).substring(7);
    console.log(`Player ${playerId} connected`);
    
    // Send welcome message with playerId
    socket.send(JSON.stringify({ type: 'playerId', playerId }));

    socket.on('message', (message) => {
      console.log('📩 Received:', message.toString());

      try {
        const data = JSON.parse(message.toString());
        
        // Broadcast to all other players
        for (const client of clients) {
          if (client !== socket && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    socket.on('close', () => {
      clients.delete(socket);
      console.log(`❌ Player ${playerId} disconnected`);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(socket);
    });
  });
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