// types.ts - Shared types and constants

// Game constants
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;
export const PADDLE_WIDTH = 10;
export const PADDLE_HEIGHT = 80;
export const BALL_SIZE = 16;
export const BALL_SPEED = 8;
export const c_WIN = 7;
export const COUNTDOWN_TIME = 5;
export const PADDLE_SPEED = 7;

// Interfaces
export interface Player {
  id: string;
  name: string;
  score: number;
  playerIndex: number; // 0 for player 1, 1 for player 2
  paddleY: number;
  paddleY_3d: number;
  socket: any;
  isreastarded: boolean; // true if player is restarted
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
  ballState: BallState;
  game2D:boolean;
  game2vs2:boolean;
}

export interface BallState {
  x: number;
  y: number;
  z: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
}

// Add ball physics constants
export const BALL_PHYSICS = {
  gravity: -0.018,
  ballRadius: 2,
  tableY: 53,
  tableMinX: -60,
  tableMaxX: 60,
  tableMinZ: -58,
  tableMaxZ: 1,
  bounceDamping: 0.65,
  initialVelocity: { x: 1.2, y: 0.25, z: 0.4 }
};

export interface GameRoom {
  id: string;
  gameState: GameState;
  players: Map<string, Player>;
  gameLoop?: NodeJS.Timeout;
  startTime?: number;
  tournamentId?: string;
}

// Global state - you can import and use these anywhere
export const gameRooms = new Map<string, GameRoom>();
export const waitingPlayers: Array<{ playerId: string; socket: any }> = [];
export const waitingPlayers2vs2: Array<{ playerId: string; socket: any }> = [];
export const waitingPlayers3d: Array<{ playerId: string; socket: any }> = [];
// List to hold invited players for private games : two players in the smae room
export const invitedPlayers: Array<{ playerId: string; socket: any; roomId: string; player_two_ID: string }> = [];
// List to hold invited players for tournament games
export const invitedPlayersTournament: Array<{ 
  player_one_ID: string; 
  player_two_ID: string;
  roomId: string;
  tournamentId: string;
  player_one_socket?: any;
  player_two_socket?: any;
}> = [];