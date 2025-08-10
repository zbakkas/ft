// types.ts - Shared types and constants

// Game constants
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;
export const PADDLE_WIDTH = 10;
export const PADDLE_HEIGHT = 80;
export const BALL_SIZE = 16;
export const BALL_SPEED = 6;
export const c_WIN = 7;
export const COUNTDOWN_TIME = 5;
export const PADDLE_SPEED = 5;

// Interfaces
export interface Player {
  id: string;
  name: string;
  score: number;
  playerIndex: number; // 0 for player 1, 1 for player 2
  paddleY: number;
  socket: any;
}

export interface GameState {
  ballX: number;
  ballY: number;
  ballVelocityX: number;
  ballVelocityY: number;
  players: Map<string, Player>;
  gameRunning: boolean;
  gameOver: boolean;
  gameId: string;
}

export interface GameRoom {
  id: string;
  gameState: GameState;
  players: Map<string, Player>;
  gameLoop?: NodeJS.Timeout;
}

// Global state - you can import and use these anywhere
export const gameRooms = new Map<string, GameRoom>();
export const waitingPlayers: Array<{ playerId: string; socket: any }> = [];