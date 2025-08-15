


import { startGameLoop_3D } from '../test2';
import { 
  GameRoom, 
  GameState, 
  Player, 
  gameRooms, 
  waitingPlayers,
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  BALL_SPEED,
  COUNTDOWN_TIME,
  BALL_PHYSICS
} from './types';
import { broadcastGameState, updateGameState } from './updateGameState';

// Matchmaking system - automatically pair players
export const  handlePlayerJoin = (connection: any, playerId: string) => {
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

// Generate unique game ID
const generateGameId = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
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
    paddleY: 200, // Initial position for player 1
    paddleY_3d: -28, // Initial position for player 1 in 3D
    socket: player1.socket,
    isreastarded: false // Initialize as not restarted
  };

  const gamePlayer2: Player = {
    id: player2.playerId,
    name: "Player 22",
    score: 0,
    playerIndex: 1,
    paddleY:200,
    paddleY_3d: -28, // Initial position for player 2 in 3D
    socket: player2.socket,
    isreastarded: false // Initialize as not restarted
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

    console.log("🔅🔅vStarting game for players: ", room.gameState.players.size, "game over", room.gameState.gameOver);
    if( room.gameState.players.size<=1 ) return;
    room.gameState.gameRunning = true;
    if( room.gameState.game2D ) {
    startGameLoop(room);
    }
    else
    {
      startGameLoop_3D(room);
    }
    // broadcastGameState(room);
    
    room.players.forEach(player => {
      player.socket.send(JSON.stringify({
        type: 'gameStarted',
        message: 'Game started! Use W/S or Arrow keys to move your paddle.'
      }));
    });
  }, COUNTDOWN_TIME *1000); // COUNTDOWN_TIME second delay before auto-start
};


// Create initial game state
const createGameState = (gameId: string): GameState => ({
  ballX: CANVAS_WIDTH / 2,
  ballY: CANVAS_HEIGHT / 2,
  ballVelocityX: BALL_SPEED,
  ballVelocityY: BALL_SPEED,
  players: new Map(),
  gameRunning: false,
  gameOver: false,
  gameId,
  game2D: true,
  ballState: 
  {
    x: 0,
    y: BALL_PHYSICS.tableY + 5,
    z: -28.5,
    velocityX: Math.random() > 0.5 ? BALL_PHYSICS.initialVelocity.x : -BALL_PHYSICS.initialVelocity.x,
    velocityY: BALL_PHYSICS.initialVelocity.y,
    velocityZ: (Math.random() - 0.5) * 0.6
  }
});


// Start game loop for a room
const startGameLoop = (room: GameRoom) => 
{
  if (room.gameLoop) {
    clearInterval(room.gameLoop);
  }

  room.gameLoop = setInterval(() => {
    updateGameState(room);
    broadcastGameState(room);
  }, 1000 / 60); // 60 FPS
};
