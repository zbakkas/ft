import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Initialize database
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'skyjo.db');
const db: DatabaseType = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- Matches table
  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL,
    room_name TEXT NOT NULL,
    game_mode TEXT NOT NULL,
    max_score INTEGER,
    total_turns INTEGER,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER DEFAULT 0
  );

  -- Players table (stores unique players by their ID)
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Match participants (links players to matches with their results)
  CREATE TABLE IF NOT EXISTS match_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    avatar TEXT,
    final_score INTEGER NOT NULL,
    position INTEGER NOT NULL,
    round_scores TEXT, -- JSON array of scores per round
    is_winner BOOLEAN DEFAULT 0,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
  );

  -- Player statistics (cached for faster queries)
  CREATE TABLE IF NOT EXISTS player_stats (
    player_id TEXT PRIMARY KEY,
    total_games INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    total_play_time INTEGER DEFAULT 0,
    best_score INTEGER,
    total_score INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    last_game_won BOOLEAN DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
  );

  -- Create indexes for faster queries
  CREATE INDEX IF NOT EXISTS idx_match_players_player ON match_players(player_id);
  CREATE INDEX IF NOT EXISTS idx_match_players_match ON match_players(match_id);
  CREATE INDEX IF NOT EXISTS idx_matches_ended ON matches(ended_at);
`);

console.log('✅ Database initialized successfully');

// Types
export interface MatchResult {
  roomId: string;
  roomName: string;
  gameMode: string;
  maxScore?: number;
  totalTurns?: number;
  durationSeconds: number;
  players: PlayerResult[];
}

export interface PlayerResult {
  playerId: string;
  playerName: string;
  avatar: string;
  finalScore: number;
  position: number;
  roundScores: number[];
  isWinner: boolean;
}

export interface PlayerStats {
  playerId: string;
  username: string;
  avatar: string;
  totalGames: number;
  wins: number;
  winRate: number;
  totalPlayTime: number;
  bestScore: number | null;
  averageScore: number;
  currentStreak: number;
  bestStreak: number;
}

export interface GameHistory {
  id: number;
  roomId: string;
  roomName: string;
  date: string;
  time: string;
  duration: string;
  players: string[];
  winner: string;
  position: number;
  finalScore: number;
}

// Database functions

/**
 * Save or update a player
 */
export function upsertPlayer(playerId: string, username: string, avatar: string = ''): void {
  const stmt = db.prepare(`
    INSERT INTO players (id, username, avatar, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      username = excluded.username,
      avatar = excluded.avatar,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(playerId, username, avatar);
}

/**
 * Save a completed match and update player stats
 */
export function saveMatchResult(result: MatchResult): number {
  const insertMatch = db.prepare(`
    INSERT INTO matches (room_id, room_name, game_mode, max_score, total_turns, duration_seconds, ended_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  const insertMatchPlayer = db.prepare(`
    INSERT INTO match_players (match_id, player_id, player_name, avatar, final_score, position, round_scores, is_winner)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    // Insert match
    const matchInfo = insertMatch.run(
      result.roomId,
      result.roomName,
      result.gameMode,
      result.maxScore || null,
      result.totalTurns || null,
      result.durationSeconds
    );
    const matchId = matchInfo.lastInsertRowid as number;

    // Insert each player's result
    for (const player of result.players) {
      // Ensure player exists
      upsertPlayer(player.playerId, player.playerName, player.avatar);

      // Insert match player result
      insertMatchPlayer.run(
        matchId,
        player.playerId,
        player.playerName,
        player.avatar,
        player.finalScore,
        player.position,
        JSON.stringify(player.roundScores),
        player.isWinner ? 1 : 0
      );

      // Update player stats
      updatePlayerStats(player.playerId, player.finalScore, player.isWinner, result.durationSeconds);
    }

    return matchId;
  });

  return transaction();
}

/**
 * Update player statistics after a game
 */
function updatePlayerStats(playerId: string, score: number, isWinner: boolean, durationSeconds: number): void {
  // Get current stats
  const currentStats = db.prepare(`
    SELECT * FROM player_stats WHERE player_id = ?
  `).get(playerId) as any;

  if (!currentStats) {
    // Create new stats record
    db.prepare(`
      INSERT INTO player_stats (player_id, total_games, wins, total_play_time, best_score, total_score, current_streak, best_streak, last_game_won)
      VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      playerId,
      isWinner ? 1 : 0,
      durationSeconds,
      score,
      score,
      isWinner ? 1 : 0,
      isWinner ? 1 : 0,
      isWinner ? 1 : 0
    );
  } else {
    // Update streak
    let newStreak = isWinner ? currentStats.current_streak + 1 : 0;
    let bestStreak = Math.max(currentStats.best_streak, newStreak);

    // Update best score (lower is better in Skyjo)
    let bestScore = currentStats.best_score;
    if (bestScore === null || score < bestScore) {
      bestScore = score;
    }

    db.prepare(`
      UPDATE player_stats SET
        total_games = total_games + 1,
        wins = wins + ?,
        total_play_time = total_play_time + ?,
        best_score = ?,
        total_score = total_score + ?,
        current_streak = ?,
        best_streak = ?,
        last_game_won = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE player_id = ?
    `).run(
      isWinner ? 1 : 0,
      durationSeconds,
      bestScore,
      score,
      newStreak,
      bestStreak,
      isWinner ? 1 : 0,
      playerId
    );
  }
}

/**
 * Get player statistics
 */
export function getPlayerStats(playerId: string): PlayerStats | null {
  const row = db.prepare(`
    SELECT 
      p.id as playerId,
      p.username,
      p.avatar,
      COALESCE(ps.total_games, 0) as totalGames,
      COALESCE(ps.wins, 0) as wins,
      COALESCE(ps.total_play_time, 0) as totalPlayTime,
      ps.best_score as bestScore,
      COALESCE(ps.total_score, 0) as totalScore,
      COALESCE(ps.current_streak, 0) as currentStreak,
      COALESCE(ps.best_streak, 0) as bestStreak
    FROM players p
    LEFT JOIN player_stats ps ON p.id = ps.player_id
    WHERE p.id = ?
  `).get(playerId) as any;

  if (!row) return null;

  return {
    playerId: row.playerId,
    username: row.username,
    avatar: row.avatar,
    totalGames: row.totalGames,
    wins: row.wins,
    winRate: row.totalGames > 0 ? Math.round((row.wins / row.totalGames) * 100) : 0,
    totalPlayTime: row.totalPlayTime,
    bestScore: row.bestScore,
    averageScore: row.totalGames > 0 ? Math.round((row.totalScore / row.totalGames) * 10) / 10 : 0,
    currentStreak: row.currentStreak,
    bestStreak: row.bestStreak,
  };
}

/**
 * Get game history for a player
 */
export function getPlayerGameHistory(playerId: string, limit: number = 20): GameHistory[] {
  const rows = db.prepare(`
    SELECT 
      m.id,
      m.room_id as roomId,
      m.room_name as roomName,
      m.ended_at as endedAt,
      m.duration_seconds as durationSeconds,
      mp.final_score as finalScore,
      mp.position,
      (
        SELECT GROUP_CONCAT(mp2.player_name, ',')
        FROM match_players mp2
        WHERE mp2.match_id = m.id
      ) as players,
      (
        SELECT mp3.player_name
        FROM match_players mp3
        WHERE mp3.match_id = m.id AND mp3.is_winner = 1
        LIMIT 1
      ) as winner
    FROM matches m
    JOIN match_players mp ON m.id = mp.match_id
    WHERE mp.player_id = ?
    ORDER BY m.ended_at DESC
    LIMIT ?
  `).all(playerId, limit) as any[];

  return rows.map(row => {
    const endedAt = new Date(row.endedAt);
    const durationMins = Math.round(row.durationSeconds / 60);
    
    return {
      id: row.id,
      roomId: row.roomId,
      roomName: row.roomName,
      date: endedAt.toISOString().split('T')[0],
      time: endedAt.toTimeString().substring(0, 5),
      duration: `${durationMins} mins`,
      players: row.players ? row.players.split(',') : [],
      winner: row.winner || '',
      position: row.position,
      finalScore: row.finalScore,
    };
  });
}

/**
 * Get frequent opponents for a player
 */
export function getFrequentOpponents(playerId: string, limit: number = 5): { name: string; avatar: string; count: number }[] {
  const rows = db.prepare(`
    SELECT 
      mp2.player_name as name,
      mp2.avatar as avatar,
      COUNT(*) as count
    FROM match_players mp1
    JOIN match_players mp2 ON mp1.match_id = mp2.match_id
    WHERE mp1.player_id = ? AND mp2.player_id != ?
    GROUP BY mp2.player_id, mp2.player_name, mp2.avatar
    ORDER BY count DESC
    LIMIT ?
  `).all(playerId, playerId, limit) as any[];

  return rows.map(row => ({
    name: row.name,
    avatar: row.avatar || '',
    count: row.count,
  }));
}

/**
 * Get leaderboard
 */
export function getLeaderboard(limit: number = 10): { rank: number; username: string; avatar: string; wins: number; winRate: number }[] {
  const rows = db.prepare(`
    SELECT 
      p.username,
      p.avatar,
      COALESCE(ps.wins, 0) as wins,
      COALESCE(ps.total_games, 0) as totalGames
    FROM players p
    LEFT JOIN player_stats ps ON p.id = ps.player_id
    WHERE ps.total_games > 0
    ORDER BY ps.wins DESC, (CAST(ps.wins AS FLOAT) / ps.total_games) DESC
    LIMIT ?
  `).all(limit) as any[];

  return rows.map((row, index) => ({
    rank: index + 1,
    username: row.username,
    avatar: row.avatar,
    wins: row.wins,
    winRate: row.totalGames > 0 ? Math.round((row.wins / row.totalGames) * 100) : 0,
  }));
}

export default db;
