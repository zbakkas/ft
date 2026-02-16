/*
  Warnings:

  - You are about to drop the column `scheduled_at` on the `matches` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_matches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournament_id" TEXT NOT NULL,
    "player_one_id" TEXT,
    "player_two_id" TEXT,
    "winner_id" TEXT,
    "round" INTEGER NOT NULL,
    "slot" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "game_match_id" TEXT,
    "played_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" DATETIME,
    CONSTRAINT "matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_matches" ("created_at", "deleted_at", "game_match_id", "id", "played_at", "player_one_id", "player_two_id", "round", "slot", "status", "tournament_id", "winner_id") SELECT "created_at", "deleted_at", "game_match_id", "id", "played_at", "player_one_id", "player_two_id", "round", "slot", "status", "tournament_id", "winner_id" FROM "matches";
DROP TABLE "matches";
ALTER TABLE "new_matches" RENAME TO "matches";
CREATE INDEX "matches_tournament_id_idx" ON "matches"("tournament_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
