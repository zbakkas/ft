# Game Results Database

This backend now stores game results in an SQLite database.

## Features

- **Automatic storage**: Game results are automatically saved when a match finishes
- **SQLite database**: Uses `sql.js` for a pure JavaScript SQLite implementation (no compilation needed)
- **Match tracking**: Stores player IDs, scores, winner, game mode, and match duration

## Database Schema

The `game_results` table contains:
- `id`: Auto-incrementing primary key
- `game_id`: Unique game identifier
- `player1_id`: Player 1's ID
- `player1_score`: Player 1's final score
- `player2_id`: Player 2's ID (or team in 2v2)
- `player2_score`: Player 2's final score (or team in 2v2)
- `winner_id`: ID of the winner
- `game_mode`: Type of game ('1v1', '2v2', '3d')
- `duration`: Match duration in milliseconds
- `timestamp`: When the match finished

## API Endpoints

### Get all game results
```
GET http://localhost:3000/api/v1/game/game-results
```

Returns all game results sorted by most recent.

### Get results for a specific player
```
GET http://localhost:3000/api/v1/game/game-results/:playerId
```

Returns all games where the specified player participated.

## Database File

The database is stored at: `backend/game_results.db`

## Usage Example

```bash
# Get all results
curl http://localhost:3000/api/v1/game/game-results

# Get results for a specific player
curl http://localhost:3000/api/v1/game/game-results/player123
```

## How It Works

1. When a game starts, `startTime` is recorded
2. When a game ends (player reaches winning score), the result is saved to the database
3. The database file is automatically created on first use
4. Results include match duration calculated from start to finish time

## Notes

- For 2v2 games, player IDs are stored as comma-separated values (e.g., "player1,player2")
- Duration is in milliseconds (divide by 1000 for seconds)
- The database persists across server restarts
