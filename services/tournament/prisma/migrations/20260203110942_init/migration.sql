/*
  Warnings:

  - You are about to drop the column `end_date` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `tournaments` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tournaments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "winner_id" TEXT,
    "number_of_participants" INTEGER NOT NULL DEFAULT 4,
    "created_by" TEXT NOT NULL,
    CONSTRAINT "tournaments_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "participants" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tournaments" ("created_at", "created_by", "deleted_at", "id", "name", "number_of_participants", "status", "updated_at", "winner_id") SELECT "created_at", "created_by", "deleted_at", "id", "name", "number_of_participants", "status", "updated_at", "winner_id" FROM "tournaments";
DROP TABLE "tournaments";
ALTER TABLE "new_tournaments" RENAME TO "tournaments";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
