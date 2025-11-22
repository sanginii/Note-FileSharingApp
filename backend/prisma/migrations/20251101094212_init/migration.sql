-- CreateTable
CREATE TABLE "SecureNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "encryptedData" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "expiresAt" TIMESTAMP,
    "maxViews" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isFile" BOOLEAN NOT NULL DEFAULT false,
    "fileName" TEXT,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destroyed" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE INDEX "SecureNote_id_idx" ON "SecureNote"("id");

-- CreateIndex
CREATE INDEX "SecureNote_createdAt_idx" ON "SecureNote"("createdAt");
