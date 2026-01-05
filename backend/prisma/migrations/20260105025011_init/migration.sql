-- CreateTable
CREATE TABLE "complexes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "naverComplexId" TEXT,
    "customNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "listings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "complexId" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "area" REAL NOT NULL,
    "floor" INTEGER NOT NULL,
    "direction" TEXT,
    "tradetype" TEXT NOT NULL,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "listings_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "complexes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
