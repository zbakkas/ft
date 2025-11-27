import { startGameLoop_3D, stopGameLoop_3D } from '../server';
import { stopGameLoop } from './gameLogic';
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
  waitingPlayers2vs2,
  waitingPlayers3d,
  COUNTDOWN_TIME
} from './types';

export const handlePlayerDisconnect = (playerId: string) => {
  console.log(`Player ${playerId} disconnecting...`);
  
  // Remove from waiting list if present
  const waitingIndex = waitingPlayers.findIndex(p => p.playerId === playerId);
  if (waitingIndex !== -1) {
    waitingPlayers.splice(waitingIndex, 1);
    console.log(`Removed ${playerId} from waiting list. Waiting players: ${waitingPlayers.length}`);
    return;
  }
  const waitingIndex3d = waitingPlayers3d.findIndex(p => p.playerId === playerId);
  if (waitingIndex3d !== -1) {
    waitingPlayers3d.splice(waitingIndex3d, 1);
    console.log(`Removed ${playerId} from 3D waiting list. Waiting players: ${waitingPlayers3d.length}`);
    return;
  }
  const waitingIndex2vs2 = waitingPlayers2vs2.findIndex(p => p.playerId === playerId);
  if (waitingIndex2vs2 !== -1) {
    waitingPlayers2vs2.splice(waitingIndex2vs2, 1);
    console.log(`Removed ${playerId} from 2vs2 waiting list. Waiting players: ${waitingPlayers2vs2.length}`);
    return;
  }
  

  // Remove from active game
  const room = findRoomByPlayerId(playerId);
  if (!room) return;

  room.players.delete(playerId);
  room.gameState.players.delete(playerId);
  
  //if game is not over 
  if( !room.gameState.gameOver)
  {
    // Stop game if a player disconnects
    room.gameState.gameRunning = false;
    room.gameState.gameOver = true;
    stopGameLoop(room);
    stopGameLoop_3D(room);
  

    // Notify remaining player and add them back to waiting list
    room.players.forEach(player => 
    {
      player.socket.send(JSON.stringify(
      {
      type: 'opponentDisconnected',
      message: 'Your opponent disconnected. you are the winner!',

     }));
     
    
    // Add remaining player back to waiting list
    // waitingPlayers.push({ playerId: player.id, socket: player.socket });
    
    // player.socket.send(JSON.stringify({
    //   type: 'waitingForOpponent',
    //   message: 'Waiting for a new opponent...',
    //   waitingPlayers: waitingPlayers.length
    // }));
    });
  }

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