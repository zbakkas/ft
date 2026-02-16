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

export const resetBall = (gameState: GameState) => 
{
  gameState.ballX = CANVAS_WIDTH / 2;
  gameState.ballY = CANVAS_HEIGHT / 2;
  gameState.ballVelocityX = (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED;
  gameState.ballVelocityY = (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED;
};

// Stop game loop for a room
export const stopGameLoop = (room: GameRoom) => {
  if (room.gameLoop) {
    clearInterval(room.gameLoop);
    room.gameLoop = undefined;
  }
};