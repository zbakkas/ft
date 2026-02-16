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
  COUNTDOWN_TIME,
  BALL_PHYSICS,
  invitedPlayersTournament
} from './ts/types';
import { getAllGameResults, getPlayerResults } from './ts/database';
import rabbit from './ts/rabbit';


const fastify = Fastify({ logger: true });
export { fastify };

// Register plugins
fastify.register(cors, {
  origin: true,
  credentials: true
});

fastify.register(rabbit);

fastify.register(fastifyWebsocket);

fastify.get('/', async (req, reply) => {
  return 'WebSocket server is running';
});

// API endpoint to get all game results
fastify.get('/api/game-results', async (req, reply) => {
  try {
    const results = await getAllGameResults();
    return { success: true, data: results };
  } catch (error) {
    return { success: false, error: 'Failed to fetch game results' };
  }
});

// API endpoint to get game results by player
fastify.get('/api/game-results/:playerId', async (req, reply) => {
  try {
    const { playerId } = req.params as { playerId: string };
    const results = await getPlayerResults(playerId);
    return { success: true, data: results };
  } catch (error) {
    return { success: false, error: 'Failed to fetch player results' };
  }
});

// API endpoint to create a tournament invitation
fastify.post('/api/tournament/invite', async (req, reply) => {
  try {
    const { player_one_ID, player_two_ID, roomId, tournamentId } = req.body as {
      player_one_ID: string;
      player_two_ID: string;
      roomId: string;
      tournamentId: string;
    };

    if (!player_one_ID || !player_two_ID || !roomId || !tournamentId) {
      return { success: false, error: 'Missing required fields: player_one_ID, player_two_ID, roomId, tournamentId' };
    }

    // Check if this room already exists
    const existingInvite = invitedPlayersTournament.find(
      p => p.roomId === roomId
    );

    if (existingInvite) {
      return { success: false, error: 'Tournament match already exists for this room' };
    }

    // Add to tournament invitations
    invitedPlayersTournament.push({
      player_one_ID,
      player_two_ID,
      roomId,
      tournamentId,
      player_one_socket: null,
      player_two_socket: null
    });

    console.log(`Tournament invitation created: Player ${player_one_ID} vs ${player_two_ID} in tournament ${tournamentId}, room ${roomId}`);

    return { 
      success: true, 
      message: 'Tournament invitation created',
      data: { player_one_ID, player_two_ID, roomId, tournamentId }
    };
  } catch (error) {
    return { success: false, error: 'Failed to create tournament invitation' };
  }
});

// API endpoint to get all tournament invitations
fastify.get('/api/tournament/invites', async (req, reply) => {
  return { 
    success: true, 
    data: invitedPlayersTournament.map(p => ({
      player_one_ID: p.player_one_ID,
      player_two_ID: p.player_two_ID,
      roomId: p.roomId,
      tournamentId: p.tournamentId
    }))
  };
});

// API endpoint to get tournament invitations by tournament ID
fastify.get('/api/tournament/:tournamentId/invites', async (req, reply) => {
  const { tournamentId } = req.params as { tournamentId: string };
  const invites = invitedPlayersTournament.filter(p => p.tournamentId === tournamentId);
  return { 
    success: true, 
    data: invites.map(p => ({
      player_one_ID: p.player_one_ID,
      player_two_ID: p.player_two_ID,
      roomId: p.roomId,
      tournamentId: p.tournamentId
    }))
  };
});

// API endpoint to delete a tournament invitation
fastify.delete('/api/tournament/invite/:roomId', async (req, reply) => {
  const { roomId } = req.params as { roomId: string };
  const index = invitedPlayersTournament.findIndex(p => p.roomId === roomId);
  
  if (index === -1) {
    return { success: false, error: 'Tournament invitation not found' };
  }
  
  invitedPlayersTournament.splice(index, 1);
  return { success: true, message: 'Tournament invitation deleted' };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 7009, host: '0.0.0.0' });
    console.log('🎮 Pong server running on http://localhost:7009');
    console.log('🚀 WebSocket endpoint: ws://localhost:7009/ws');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
// gameLogic.ts - Game logic functions
///////////////////////////////////////////////////////////////////////////

import { handlePlayerJoin, handlePlayerJoin_2vs2, handlePlayerJoin_3d } from './ts/handlePlayerJoin';
import { handlePlayerDisconnect } from './ts/handlePlayerDisconnect';
import { handlePaddleMove, handlePaddleMove_2vs2 } from './ts/handlePaddleMove';
import { saveGameResult } from './ts/database';

////////////////////////////////////////////////////////////////////////////


// Helper function to check if player is already in an active game
const isPlayerInActiveGame = (playerId: string): { inGame: boolean; roomId?: string } => {
  for (const room of gameRooms.values()) {
    if (room.players.has(playerId)) {
      return { inGame: true, roomId: room.id };
    }
  }
  return { inGame: false };
};

// Helper function to check if player is in waiting queue
const isPlayerInWaitingQueue = (playerId: string): boolean => {
  return waitingPlayers.some(player => player.playerId === playerId);
};

// API endpoint to check if player can join a game (call before WebSocket connection)
// fastify.get('/api/can-join/:playerId', async (req, reply) => {
//   const { playerId } = req.params as { playerId: string };
  
//   const activeGameCheck = isPlayerInActiveGame(playerId);
//   if (activeGameCheck.inGame) {
//     return { 
//       canJoin: false, 
//       reason: 'already_in_game', 
//       message: 'Player is already in an active game',
//       roomId: activeGameCheck.roomId 
//     };
//   }
  
//   if (isPlayerInWaitingQueue(playerId)) {
//     return { 
//       canJoin: false, 
//       reason: 'already_waiting', 
//       message: 'Player is already in the waiting queue' 
//     };
//   }
  
//   return { canJoin: true };
// });
//////////////////////////////////////////////////////////////////////////////////////
// URL-based game mode selection approach
fastify.register(async function (fastify) {
  // Default WebSocket endpoint (could default to 1v1)
  type QueryGM = {
    userId: string;
  }
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    const {userId: playerId} = req.query as QueryGM;
    const { privatee, roomId, player_two_Id, tournamentId } = req.query as { privatee: string; roomId: string ; player_two_Id:string; tournamentId:string};
    
    console.log("Private param:", privatee, "Room ID:", roomId, "Player _tow ID:", player_two_Id, "Tournament ID:", tournamentId);
    
    // Check if player is already in an active game or waiting queue
    const activeGameCheck = isPlayerInActiveGame(playerId);
    if (!playerId || isPlayerInWaitingQueue(playerId) || activeGameCheck.inGame) {
      connection.send(JSON.stringify({
        type: 'error',
        message: 'You are already in a game or waiting in queue. Please close other game tabs.'
      }));
      connection.close();
      return;
    }
    
    console.log(`Player ${playerId} connected to default endpoint (1v1)`);
    
    // Default to 1v1 mode
    if( privatee === 'true' && roomId ) {
      handlePlayerJoin(connection, playerId, fastify, true, roomId, player_two_Id, tournamentId);
    }
    else
    {
      handlePlayerJoin(connection, playerId, fastify);
    }
    
    setupMessageHandlers(connection, playerId, '1v1');
  });

  // 1v1 2D specific endpoint
  // fastify.get('/ws/1v1', { websocket: true }, (connection, req) => {
  //   const playerId = Math.random().toString(36).substring(7);
  //   console.log(`Player ${playerId} connected to 1v1 mode`);
    
  //   handlePlayerJoin(connection, playerId);
    
  //   setupMessageHandlers(connection, playerId, '1v1');
  // });
  // 1v1 3D specific endpoint
  fastify.get('/ws/3d', { websocket: true }, (connection, req) => {
    const {userId: playerId} = req.query as QueryGM;
    
    // Check if player is already in an active game or waiting queue
    const activeGameCheck = isPlayerInActiveGame(playerId);
    if (!playerId || isPlayerInWaitingQueue(playerId) || activeGameCheck.inGame) {
      connection.send(JSON.stringify({
        type: 'error',
        message: 'You are already in a game or waiting in queue. Please close other game tabs.'
      }));
      connection.close();
      return;
    }
    
    console.log(`Player ${playerId} connected to 3d mode`);
    
    handlePlayerJoin_3d(connection, playerId, fastify);
    
    setupMessageHandlers(connection, playerId, '3d');
  });

  // 2v2 specific endpoint
  fastify.get('/ws/2v2', { websocket: true }, (connection, req) => {
    const {userId: playerId} = req.query as QueryGM;
    
    // Check if player is already in an active game or waiting queue
    const activeGameCheck = isPlayerInActiveGame(playerId);
    if (!playerId || isPlayerInWaitingQueue(playerId) || activeGameCheck.inGame) {
      connection.send(JSON.stringify({
        type: 'error',
        message: 'You are already in a game or waiting in queue. Please close other game tabs.'
      }));
      connection.close();
      return;
    }
    
    console.log(`Player ${playerId} connected to 2v2 mode`);
    
    handlePlayerJoin_2vs2(connection, playerId, fastify);
    
    setupMessageHandlers(connection, playerId, '2v2');
  });
});

// Shared message handler setup
const setupMessageHandlers = (connection: any, playerId: string, gameMode: string) => {
  // Store the game mode for this player
  // playerGameModes.set(playerId, gameMode);
  
  connection.on('message', (message: { toString: () => string; }) => {
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case 'gameType':
          get_params(playerId, data.game);
          break;
          
        case 'paddleMove':
          // if (gameMode === '1v1') {
            handlePaddleMove(playerId, data.direction);
          // }
          break;

        case 'paddleMove2vs2':
          // if (gameMode === '2v2') {
            handlePaddleMove_2vs2(playerId, data.direction);
          // }
          break;

        case 'paddleMove3D':
          handlePaddleMove_3D(playerId, data.direction);
          break;
          
        // case 'startGame':
        //   handleStartGame(playerId);
        //   break;
          
        // case 'pauseGame':
        //   handlePauseGame(playerId);
        //   break;
          
        case 'resetGame':
          handleResetGame(playerId);
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  connection.on('close', () => {
    // playerGameModes.delete(playerId);
    handlePlayerDisconnect(playerId);
  });

  // Send confirmation of game mode
  connection.send(JSON.stringify({
    type: 'connected',
    playerId: playerId,
    gameMode: gameMode,
    message: `Connected in ${gameMode} mode. Searching for match...`
  }));
};


const get_params = (playerid:string , gameType:string) => {
  // Find the room containing this player
  let playerRoom: GameRoom | undefined;
  let player: Player | undefined;

  for (const room of gameRooms.values()) {
    player = room.players.get(playerid);
    if (player) {
      playerRoom = room;
      break;
    }
  }
  if( !playerRoom) return;
  if( gameType === '3D') 
  {
    playerRoom.gameState.game2D = false;
  }
  if( gameType === '2vs2') 
  {
    playerRoom.gameState.game2vs2 = true;
  }

}

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
  player.paddleY_3d = direction;
  
  // Also update in the gameState players map if it exists there
  if (playerRoom.gameState.players.has(playerId)) {
    playerRoom.gameState.players.get(playerId)!.paddleY_3d = direction;
  }

  // console.log(`Player ${playerId} moved paddle to position: ${direction}`);

  // Now broadcast the updated game state
  broadcastGameState_3D(playerRoom);
}

// // Also, make sure your broadcastGameState_3D function is getting the updated data
// export const broadcastGameState_3D = (room: GameRoom) => {
//  room.gameState.players.forEach(player => {
//    try {
//      const gameData = {
//        type: 'gameState_3D',
//        gameState: {
//          ballX: 0,
//          ballY: 0,
//          gameRunning: room.gameState.gameRunning,
//          players: Array.from(room.gameState.players.values()).map(p => ({
//            id: p.id,
//            paddleY: p.paddleY, // This should now have the updated position
//            score: p.score,
//            playerIndex: p.playerIndex
//          }))
//        },
//        yourPlayerIndex: player.playerIndex
//      };
     
//      console.log(`Broadcasting to player ${player.id}: paddleY = ${player.paddleY}`);
//      player.socket.send(JSON.stringify(gameData));
//    } catch (error) {
//      console.error('Error sending to player:', error);
//    }
//  });
// };







// Server-side ball physics update
const updateBallPhysics = (room: GameRoom) => {
  const ball = room.gameState.ballState;
  if (!ball) return;

  // Apply gravity
  ball.velocityY += BALL_PHYSICS.gravity;

  // Update position
  ball.x += ball.velocityX*1.2;
  ball.y += ball.velocityY*1.2;
  ball.z += ball.velocityZ*1.2;

  // Table bounce
  if (ball.y <= BALL_PHYSICS.tableY + BALL_PHYSICS.ballRadius && ball.velocityY < 0) {
    if (ball.x >= BALL_PHYSICS.tableMinX && ball.x <= BALL_PHYSICS.tableMaxX &&
        ball.z >= BALL_PHYSICS.tableMinZ && ball.z <= BALL_PHYSICS.tableMaxZ) {
      
      ball.y = BALL_PHYSICS.tableY + BALL_PHYSICS.ballRadius;
      ball.velocityY = Math.abs(ball.velocityY) * BALL_PHYSICS.bounceDamping;
      
      // Ensure medium bounce height
      if (ball.velocityY < 0.15) ball.velocityY = 0.18;
      if (ball.velocityY > 0.55) ball.velocityY = 0.5;
    }
  }

  // Wall bounces
  if (ball.z <= BALL_PHYSICS.tableMinZ || ball.z >= BALL_PHYSICS.tableMaxZ) {
    ball.velocityZ *= -1;
    ball.z = ball.z <= BALL_PHYSICS.tableMinZ ? BALL_PHYSICS.tableMinZ : BALL_PHYSICS.tableMaxZ;
  }

  // Check paddle collisions
  checkServerPaddleCollisions(room);
  const { gameState } = room;
  const players = Array.from(gameState.players.values());
  const player1 = players.find(p => p.playerIndex === 0);
  const player2 = players.find(p => p.playerIndex === 1);

  // Reset if out of bounds
  // if (ball.y < 20 || Math.abs(ball.x) > 100) {
  //   resetServerBall(room);
  // }

  if(player1 && player2 )
  {
  // Ball passed Player 2’s side → Player 1 scores
  if (ball.x < -100) {
    player1.score++;
    resetServerBall(room);
    console.log(`Server: Player 1 scored! New score: ${player1.score}`);
  }

  // Ball passed Player 1’s side → Player 2 scores
  if (ball.x > 100) {
    player2.score++;
    resetServerBall(room);
    console.log(`Server: Player 2 scored! New score: ${player2.score}`);
  }

  // End game if any player reaches score of 5
  if( player1.score >= c_WIN || player2.score >= c_WIN) 
  {
    gameState.gameRunning = false;
    gameState.gameOver = true;
    stopGameLoop_3D(room);
    
    // Determine winner
    const winnerId = player1.score >= c_WIN ? player1.id : player2.id;
    
    // Save game result to database
    saveGameResult({
      gameId: gameState.gameId,
      player1Id: player1.id,
      player1Score: player1.score,
      player2Id: player2.id,
      player2Score: player2.score,
      winnerId: winnerId,
      gameMode: '3D',
      duration: Date.now() - (room.startTime || Date.now())
    });
    
    room.players.forEach(player => {
      player.socket.send(JSON.stringify({
        type: 'gameOver',
        message: `Game over! You are ${player.score >= c_WIN ? 'the winner!' : 'the loser.'}`,
      }));
    });
    return;
  }

  } 

};

// Server-side paddle collision detection
const checkServerPaddleCollisions = (room: GameRoom) => {
  const ball = room.gameState.ballState;
  if (!ball) return;

  const players = Array.from(room.gameState.players.values());
  const player1 = players.find(p => p.playerIndex === 0); // Right paddle
  const player2 = players.find(p => p.playerIndex === 1); // Left paddle

  // Player 1 paddle collision (right side)
  if (player1 && ball.x > 55 && ball.x < 65 && 
      Math.abs(ball.z - player1.paddleY_3d) < 8 && 
      Math.abs(ball.y - 50) < 16 && // paddle height
      ball.velocityX > 0) {
    
    const hitOffset = (ball.z - player1.paddleY_3d) / 8;
    ball.velocityX = -Math.abs(ball.velocityX) * 1.05;
    ball.velocityY = Math.random() * (0.7 - 0.25) + 0.25;
    ball.velocityZ = hitOffset * 1.0;
    
    console.log("Server: P1 hit - jump Y:", ball.velocityY);
  }

  // Player 2 paddle collision (left side)
  if (player2 && ball.x > -65 && ball.x < -55 && 
      Math.abs(ball.z - player2.paddleY_3d) < 8 && 
      Math.abs(ball.y - 50) < 16 &&
      ball.velocityX < 0) {
    
    const hitOffset = (ball.z - player2.paddleY_3d) / 8;
    ball.velocityX = Math.abs(ball.velocityX) * 1.05;
    ball.velocityY = Math.random() * (0.7 - 0.25) + 0.25;
    ball.velocityZ = hitOffset * 1.0;
    
    console.log("Server: P2 hit - jump Y:", ball.velocityY);
  }
};

// Reset ball on server
const resetServerBall = (room: GameRoom) => {
  const ball = room.gameState.ballState;
  if (!ball) return;

  ball.x = 0;
  ball.y = BALL_PHYSICS.tableY + 5;
  ball.z = -28.5;
  ball.velocityX = Math.random() > 0.5 ? BALL_PHYSICS.initialVelocity.x : -BALL_PHYSICS.initialVelocity.x;
  ball.velocityY = BALL_PHYSICS.initialVelocity.y;
  ball.velocityZ = (Math.random() - 0.5) * 0.6;
  
  console.log("Server: Ball reset - Y velocity:", ball.velocityY);
};

// Start game loop for physics updates
export const startGameLoop_3D = (room: GameRoom) => {
  if (room.gameLoop) {
    clearInterval(room.gameLoop);
  }
  console.log(`✅ ✅Starting game loop for room ${room.id}`);
  
  room.gameLoop = setInterval(() => {
    updateBallPhysics(room);
    broadcastGameState_3D(room);
  }, 1000 / 60); // 60 FPS
};

// Stop game loop
export const stopGameLoop_3D = (room: GameRoom) => {
  if (room.gameLoop) {
    resetServerBall(room);
    clearInterval(room.gameLoop);
    room.gameLoop = undefined; // Changed from null to undefined
  }
};

// Updated broadcast function to include ball state
export const broadcastGameState_3D = (room: GameRoom) => {
  room.gameState.players.forEach(player => {
    try {

      const ballState = room.gameState.ballState;
      const isPlayer2 = player.playerIndex === 1;
      
      // Mirror ball position for player 2
      const ballX = isPlayer2 ? -(ballState?.x || 0) : (ballState?.x || 0);
      const ballZ = isPlayer2 ? -(ballState?.z || 0) + (-57) : (ballState?.z || 0); // Adjust Z offset if needed
      const ballVelocityX = isPlayer2 ? -(ballState?.velocityX || 0) : (ballState?.velocityX || 0);
      const ballVelocityZ = isPlayer2 ? -(ballState?.velocityZ || 0) : (ballState?.velocityZ || 0);

      const gameData = {
        type: 'gameState_3D',
        gameState: {
          ballX: ballX || 0,
          ballY: room.gameState.ballState?.y || 0,
          ballZ: room.gameState.ballState?.z || 0,
          ballVelocityX: room.gameState.ballState?.velocityX || 0,
          ballVelocityY: room.gameState.ballState?.velocityY || 0,
          ballVelocityZ: room.gameState.ballState?.velocityZ || 0,
          gameRunning: room.gameState.gameRunning,
          players: Array.from(room.gameState.players.values()).map(p => ({
            id: p.id,
            paddleY: p.paddleY_3d,
            score: p.score,
            playerIndex: p.playerIndex
          })),

        },
        yourPlayerIndex: player.playerIndex
      };
      
      player.socket.send(JSON.stringify(gameData));
    } catch (error) {
      console.error('Error sending to player:', error);
    }
  });
};

// // Updated handlePaddleMove_3D function
// const handlePaddleMove_3D = (playerId: string, direction: number) => {
//   let playerRoom: GameRoom | undefined;
//   let player: Player | undefined;

//   for (const room of gameRooms.values()) {
//     player = room.players.get(playerId);
//     if (player) {
//       playerRoom = room;
//       break;
//     }
//   }

//   if (!playerRoom || !player) return;

//   // Update paddle position with bounds checking
//   const minZ = -50;
//   const maxZ = -7;
//   player.paddleY = Math.max(minZ, Math.min(maxZ, direction));
  
//   if (playerRoom.gameState.players.has(playerId)) {
//     playerRoom.gameState.players.get(playerId)!.paddleY = player.paddleY;
//   }

//   // Don't broadcast immediately - let the game loop handle it
//   // This prevents flooding the network with paddle updates
// };



const handleResetGame = (playerId: string) => {
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

  if (!playerRoom || !player) {
    console.log(`Player ${playerId} not found in any room`);
    return;
  }

  console.log(`🔄 Resetting game for room ${playerRoom.id}`);

  // Stop current game loop if running
  stopGameLoop_3D(playerRoom);

  // Reset game state
  playerRoom.gameState.gameRunning = false;
  playerRoom.gameState.gameOver = false;
  player.isreastarded = true; // Mark player as restarted
  
  // Reset ball state
  playerRoom.gameState.ballState = {
    x: 0,
    y: BALL_PHYSICS.tableY + 5,
    z: -28.5,
    velocityX: Math.random() > 0.5 ? BALL_PHYSICS.initialVelocity.x : -BALL_PHYSICS.initialVelocity.x,
    velocityY: BALL_PHYSICS.initialVelocity.y,
    velocityZ: (Math.random() - 0.5) * 0.6
  };

  // Reset player scores and paddle positions
  playerRoom.gameState.players.forEach(p => {
    p.score = 0;
    p.paddleY_3d = -28; // Reset to center position
  });

  // Reset player scores in the room's players map too
  playerRoom.players.forEach(p => {
    p.score = 0;
    p.paddleY_3d = -28;
  });

  // Notify all players that the game has been reset if all want to restart
  let isallpalyersrestarted = true;
  playerRoom.gameState.players.forEach(p => {
    if (!p.isreastarded) {
      isallpalyersrestarted = false;
      console.log(`Player ${p.id} has not restarted yet.`);
    }
  });

  if( !isallpalyersrestarted  || playerRoom.gameState.players.size<=1) return;
  isallpalyersrestarted =true;
  playerRoom.gameState.players.forEach(p => {
    
      p.isreastarded = false; // Mark all players as restarted
      console.log(`Player ${p.id} has restarted.`);
    
  });

  playerRoom.players.forEach(roomPlayer => {
    try {
      roomPlayer.socket.send(JSON.stringify({
        type: 'gameReset',
        message: 'Game has been reset! Get ready...'
      }));
    } catch (error) {
      console.error('Error sending reset message to player:', error);
    }
  });

  // Wait a moment, then notify about match found (similar to initial matchmaking)
  setTimeout(() => {
    playerRoom!.players.forEach(roomPlayer => {
      try {
        roomPlayer.socket.send(JSON.stringify({
          type: 'matchFound',
          message: 'Match restarted! Get ready to play!',
          gameId: playerRoom!.id,
          players: Array.from(playerRoom!.gameState.players.values()).map(p => ({
            id: p.id,
            paddleY: p.paddleY_3d,
            score: p.score,
            playerIndex: p.playerIndex
          }))
        }));
      } catch (error) {
        console.error('Error sending match found message to player:', error);
      }
    });
  }, 500);

  // Start countdown and then start the game
  setTimeout(() => {
    if (playerRoom && playerRoom.players.size === 2) {
      // Start the game
      playerRoom.gameState.gameRunning = true;
      
      // Notify players game started
      playerRoom.players.forEach(roomPlayer => {
        try {
          roomPlayer.socket.send(JSON.stringify({
            type: 'gameStarted',
            message: 'Game started! Good luck!'
          }));
        } catch (error) {
          console.error('Error sending game started message to player:', error);
        }
      });

      // Start the game loop
      startGameLoop_3D(playerRoom);
      
      console.log(`✅ Game restarted successfully for room ${playerRoom.id}`);
    }
  }, COUNTDOWN_TIME * 1000 + 500); // Wait for countdown + a bit extra

  console.log(`Game reset initiated for room ${playerRoom.id}`);
}






