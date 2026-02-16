import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

// Database instance
let db: Database | null = null;
const dbPath = path.join(__dirname, '..', 'game_results.db');

// Initialize SQLite database
const initDatabase = async (): Promise<Database> => {
  if (db) return db;

  const SQL = await initSqlJs();
  
  // Try to load existing database
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create the game_results table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS game_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      player1_id TEXT NOT NULL,
      player1_score INTEGER NOT NULL,
      player2_id TEXT NOT NULL,
      player2_score INTEGER NOT NULL,
      winner_id TEXT NOT NULL,
      game_mode TEXT NOT NULL,
      duration INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Save the database to file
  saveDatabase();

  return db;
};

// Save database to file
const saveDatabase = (): void => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
};

// Interface for game result
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

// Function to save game result
export const saveGameResult = async (result: GameResult): Promise<void> => {
  try {
    const database = await initDatabase();
    
    database.run(`
      INSERT INTO game_results (
        game_id, player1_id, player1_score, player2_id, player2_score, 
        winner_id, game_mode, duration, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      result.gameId,
      result.player1Id,
      result.player1Score,
      result.player2Id,
      result.player2Score,
      result.winnerId,
      result.gameMode,
      result.duration || null
    ]);

    saveDatabase();
    console.log(`✅ Game result saved: ${result.gameId}`);
  } catch (error) {
    console.error('❌ Error saving game result:', error);
  }
};

// Optional: Function to get all game results
export const getAllGameResults = async (): Promise<any[]> => {
  try {
    const database = await initDatabase();
    const results = database.exec('SELECT * FROM game_results ORDER BY timestamp DESC');
    
    if (results.length > 0) {
      const columns = results[0].columns;
      const values = results[0].values;
      return values.map((row: any) => {
        const obj: any = {};
        columns.forEach((col: any, i: number) => {
          obj[col] = row[i];
        });
        return obj;
      });
    }
    return [];
  } catch (error) {
    console.error('❌ Error fetching game results:', error);
    return [];
  }
};

// Optional: Function to get results by player
export const getPlayerResults = async (playerId: string): Promise<any[]> => {
  try {
    const database = await initDatabase();
    const results = database.exec(`
      SELECT * FROM game_results 
      WHERE player1_id = ? OR player2_id = ?
      ORDER BY timestamp DESC
    `, [playerId, playerId]);
    
    if (results.length > 0) {
      const columns = results[0].columns;
      const values = results[0].values;
      return values.map((row: any) => {
        const obj: any = {};
        columns.forEach((col: any, i: number) => {
          obj[col] = row[i];
        });
        return obj;
      });
    }
    return [];
  } catch (error) {
    console.error('❌ Error fetching player results:', error);
    return [];
  }
};

export { initDatabase };
