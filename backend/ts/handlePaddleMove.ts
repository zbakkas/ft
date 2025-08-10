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
} from './types';
import { broadcastGameState } from './updateGameState';

export const handlePaddleMove = (playerId: string, direction: 'up' | 'down') => {
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
  console.log(`Player ${playerId} paddle moved ${direction}. New position: ${player.paddleY} . speed: ${PADDLE_SPEED} . height: ${PADDLE_HEIGHT} . canvasHeight: ${CANVAS_HEIGHT}`);

  
  // Broadcast updated state
  broadcastGameState(playerRoom);
};
