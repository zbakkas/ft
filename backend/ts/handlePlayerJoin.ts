


import { startGameLoop_3D } from '../server';
import { 
  GameRoom, 
  GameState, 
  Player, 
  gameRooms, 
  waitingPlayers,
  waitingPlayers2vs2,
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  BALL_SPEED,
  COUNTDOWN_TIME,
  BALL_PHYSICS,
  waitingPlayers3d
} from './types';
import { broadcastGameState, broadcastGameState_2vs, updateGameState, updateGameState_2vs2 } from './updateGameState';

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
    
    console.log(`Player ${playerId} added to waiting list 1VS1 🏓. Total waiting: ${waitingPlayers.length}`);
  }
};


///3D version of the matchmaking system
export const  handlePlayerJoin_3d = (connection: any, playerId: string) => {
  console.log(`Player ${playerId} looking for match...`);
  

  connection.socket.send(JSON.stringify({
    type: 'playerId',
    message: 'playerId is ' + playerId,
    playerId: playerId
  }));

  // Check if there's a waiting player
  if (waitingPlayers3d.length > 0) 
  {
    // Match with waiting player
    const waitingPlayer = waitingPlayers3d.shift()!;
    createGameForTwoPlayers(waitingPlayer, { playerId, socket: connection.socket });
    
  } 
  else 
  {
    // Add to waiting list
    waitingPlayers3d.push({ playerId, socket: connection.socket });
    
    // Notify player they're waiting
    connection.socket.send(JSON.stringify({
      type: 'waitingForOpponent',
      message: 'Waiting for an opponent...',
      waitingPlayers3d: waitingPlayers3d.length
    }));
    
    console.log(`Player ${playerId} added to waiting list 3D 🏓. Total waiting: ${waitingPlayers3d.length}`);
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
  game2vs2: false,
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
    if(room.gameState.game2vs2 ) 
    {
      // console.log("✅ 2vs2 game loop running for room: ", room.id);
      updateGameState_2vs2(room);
      broadcastGameState_2vs(room);
    }
    else
    {
      // console.log("🥎 1vs1 game loop running for room: ", room.id);
      updateGameState(room);
      broadcastGameState(room);
    }
  }, 1000 / 60); // 60 FPS
};



export const  handlePlayerJoin_2vs2 = (connection: any, playerId: string) => {
  console.log(`Player ${playerId} looking for match...`);
  

  connection.socket.send(JSON.stringify({
    type: 'playerId',
    message: 'playerId is ' + playerId,
    playerId: playerId
  }));

  // Check if there's a waiting player
  if (waitingPlayers2vs2.length > 2) 
  {
    for (let i = 0; i < waitingPlayers2vs2.length; i++) 
    {
    
        console.log(`${i} ==>Player ${waitingPlayers2vs2[i].playerId}  is already in the waiting list.`);
 
    }

    console.log(" ❗️matching players... waitingPlayers2vs2.length: ", waitingPlayers2vs2.length);
    // Match with waiting player
    const waitingPlayer = waitingPlayers2vs2.shift()!;
    createGameForFourPlayers(waitingPlayers2vs2[0], waitingPlayers2vs2[1],waitingPlayer,{ playerId, socket: connection.socket });
    //remove the players from the waiting list
    waitingPlayers2vs2.shift();
    waitingPlayers2vs2.shift();
    
  } 
  else 
  {
    // Add to waiting list
    waitingPlayers2vs2.push({ playerId, socket: connection.socket });
    
    // Notify player they're waiting
    connection.socket.send(JSON.stringify({
      type: 'waitingForOpponent',
      message: 'Waiting for an opponent...',
      waitingPlayers2vs2: waitingPlayers2vs2.length
    }));
    
    console.log(`Player ${playerId} added to waiting list 2VS2🏓🏓. Total waiting: ${waitingPlayers2vs2.length}`);
  }
};



// Create a new game for four matched players
const createGameForFourPlayers = (player1: { playerId: string; socket: any }, player2: { playerId: string; socket: any },player3: { playerId: string; socket: any }, player4: { playerId: string; socket: any }) => {
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

  const gamePlayer3: Player = {
    id: player3.playerId,
    name: "Player 333",
    score: 0,
    playerIndex: 2,
    paddleY: 200, // Initial position for player 1
    paddleY_3d: -28, // Initial position for player 1 in 3D
    socket: player3.socket,
    isreastarded: false // Initialize as not restarted
  };

  const gamePlayer4: Player = {
    id: player4.playerId,
    name: "Player 444",
    score: 0,
    playerIndex: 3,
    paddleY:200,
    paddleY_3d: -28, // Initial position for player 2 in 3D
    socket: player4.socket,
    isreastarded: false // Initialize as not restarted
  };

  // Add players to room
  room.players.set(player1.playerId, gamePlayer1);
  room.players.set(player2.playerId, gamePlayer2);
  room.players.set(player3.playerId, gamePlayer3);
  room.players.set(player4.playerId, gamePlayer4);
  
  room.gameState.players.set(player1.playerId, gamePlayer1);
  room.gameState.players.set(player2.playerId, gamePlayer2);
  room.gameState.players.set(player3.playerId, gamePlayer3);
  room.gameState.players.set(player4.playerId, gamePlayer4);

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
  // Send to player 3
  player3.socket.send(JSON.stringify({
    type: 'matchFound',
    playerId: player3.playerId,
    playerIndex: 2,
    gameId: gameId,
    gameState: gameStateData,
    message: 'Match found! You are Player 3'
  }));
  // Send to player 4
  player4.socket.send(JSON.stringify({
    type: 'matchFound',
    playerId: player4.playerId,
    playerIndex: 3,
    gameId: gameId,
    gameState: gameStateData,
    message: 'Match found! You are Player 4'
  }));

  console.log(`Game created: ${gameId} - Player1: ${player1.playerId}, Player2: ${player2.playerId}`);
  console.log(`Game created: ${gameId} - Player3: ${player3.playerId}, Player4: ${player4.playerId}`);
  

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

