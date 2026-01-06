-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_listings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "complexId" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "area" REAL NOT NULL,
    "supplyArea" REAL,
    "floor" TEXT NOT NULL,
    "direction" TEXT,
    "tradetype" TEXT NOT NULL,
    "memo" TEXT,
    "url" TEXT,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "listings_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "complexes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_listings" ("area", "complexId", "direction", "floor", "id", "memo", "price", "scrapedAt", "supplyArea", "tradetype", "url") SELECT "area", "complexId", "direction", "floor", "id", "memo", "price", "scrapedAt", "supplyArea", "tradetype", "url" FROM "listings";
DROP TABLE "listings";
ALTER TABLE "new_listings" RENAME TO "listings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
