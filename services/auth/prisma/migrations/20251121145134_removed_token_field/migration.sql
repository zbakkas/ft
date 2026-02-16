/*
  Warnings:

  - You are about to drop the column `token` on the `sessions` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" DATETIME,
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_sessions" ("created_at", "deleted_at", "expires_at", "id", "ip_address", "refresh_token", "user_agent", "user_id") SELECT "created_at", "deleted_at", "expires_at", "id", "ip_address", "refresh_token", "user_agent", "user_id" FROM "sessions";
DROP TABLE "sessions";
ALTER TABLE "new_sessions" RENAME TO "sessions";
CREATE UNIQUE INDEX "sessions_refresh_token_key" ON "sessions"("refresh_token");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_refresh_token_idx" ON "sessions"("refresh_token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
