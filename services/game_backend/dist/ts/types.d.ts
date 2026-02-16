export declare const CANVAS_WIDTH = 800;
export declare const CANVAS_HEIGHT = 400;
export declare const PADDLE_WIDTH = 10;
export declare const PADDLE_HEIGHT = 80;
export declare const BALL_SIZE = 16;
export declare const BALL_SPEED = 8;
export declare const c_WIN = 7;
export declare const COUNTDOWN_TIME = 5;
export declare const PADDLE_SPEED = 7;
export interface Player {
    id: string;
    name: string;
    score: number;
    playerIndex: number;
    paddleY: number;
    paddleY_3d: number;
    socket: any;
    isreastarded: boolean;
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
    game2D: boolean;
    game2vs2: boolean;
}
export interface BallState {
    x: number;
    y: number;
    z: number;
    velocityX: number;
    velocityY: number;
    velocityZ: number;
}
export declare const BALL_PHYSICS: {
    gravity: number;
    ballRadius: number;
    tableY: number;
    tableMinX: number;
    tableMaxX: number;
    tableMinZ: number;
    tableMaxZ: number;
    bounceDamping: number;
    initialVelocity: {
        x: number;
        y: number;
        z: number;
    };
};
export interface GameRoom {
    id: string;
    gameState: GameState;
    players: Map<string, Player>;
    gameLoop?: NodeJS.Timeout;
    startTime?: number;
    tournamentId?: string;
}
export declare const gameRooms: Map<string, GameRoom>;
export declare const waitingPlayers: Array<{
    playerId: string;
    socket: any;
}>;
export declare const waitingPlayers2vs2: Array<{
    playerId: string;
    socket: any;
}>;
export declare const waitingPlayers3d: Array<{
    playerId: string;
    socket: any;
}>;
export declare const invitedPlayers: Array<{
    playerId: string;
    socket: any;
    roomId: string;
    player_two_ID: string;
}>;
export declare const invitedPlayersTournament: Array<{
    player_one_ID: string;
    player_two_ID: string;
    roomId: string;
    tournamentId: string;
    player_one_socket?: any;
    player_two_socket?: any;
}>;
//# sourceMappingURL=types.d.ts.map