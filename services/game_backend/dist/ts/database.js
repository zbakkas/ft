"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = exports.getPlayerResults = exports.getAllGameResults = exports.saveGameResult = void 0;
const sql_js_1 = __importDefault(require("sql.js"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Database instance
let db = null;
const dbPath = path_1.default.join(__dirname, '..', 'game_results.db');
// Initialize SQLite database
const initDatabase = async () => {
    if (db)
        return db;
    const SQL = await (0, sql_js_1.default)();
    // Try to load existing database
    if (fs_1.default.existsSync(dbPath)) {
        const buffer = fs_1.default.readFileSync(dbPath);
        db = new SQL.Database(buffer);
    }
    else {
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
exports.initDatabase = initDatabase;
// Save database to file
const saveDatabase = () => {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs_1.default.writeFileSync(dbPath, buffer);
    }
};
// Function to save game result
const saveGameResult = async (result) => {
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
    }
    catch (error) {
        console.error('❌ Error saving game result:', error);
    }
};
exports.saveGameResult = saveGameResult;
// Optional: Function to get all game results
const getAllGameResults = async () => {
    try {
        const database = await initDatabase();
        const results = database.exec('SELECT * FROM game_results ORDER BY timestamp DESC');
        if (results.length > 0) {
            const columns = results[0].columns;
            const values = results[0].values;
            return values.map((row) => {
                const obj = {};
                columns.forEach((col, i) => {
                    obj[col] = row[i];
                });
                return obj;
            });
        }
        return [];
    }
    catch (error) {
        console.error('❌ Error fetching game results:', error);
        return [];
    }
};
exports.getAllGameResults = getAllGameResults;
// Optional: Function to get results by player
const getPlayerResults = async (playerId) => {
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
            return values.map((row) => {
                const obj = {};
                columns.forEach((col, i) => {
                    obj[col] = row[i];
                });
                return obj;
            });
        }
        return [];
    }
    catch (error) {
        console.error('❌ Error fetching player results:', error);
        return [];
    }
};
exports.getPlayerResults = getPlayerResults;
//# sourceMappingURL=database.js.map