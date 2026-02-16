-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "avatar_path" TEXT,
    "avatar_name" TEXT,
    "bio" TEXT,
    "language" TEXT NOT NULL DEFAULT 'eng',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_user_profiles" ("avatar_name", "avatar_path", "bio", "created_at", "id", "updated_at", "username") SELECT "avatar_name", "avatar_path", "bio", "created_at", "id", "updated_at", "username" FROM "user_profiles";
DROP TABLE "user_profiles";
ALTER TABLE "new_user_profiles" RENAME TO "user_profiles";
CREATE UNIQUE INDEX "user_profiles_username_key" ON "user_profiles"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
