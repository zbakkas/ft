import { Database } from 'sql.js';
declare const initDatabase: () => Promise<Database>;
export interface GameResult {
    gameId: string;
    player1Id: string;
    player1Score: number;
    player2Id: string;
    player2Score: number;
    winnerId: string;
    gameMode: string;
    duration?: number;
}
export declare const saveGameResult: (result: GameResult) => Promise<void>;
export declare const getAllGameResults: () => Promise<any[]>;
export declare const getPlayerResults: (playerId: string) => Promise<any[]>;
export { initDatabase };
//# sourceMappingURL=database.d.ts.map