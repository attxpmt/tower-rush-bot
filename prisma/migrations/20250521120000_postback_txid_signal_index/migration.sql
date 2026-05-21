-- AlterTable
ALTER TABLE "Postback" ADD COLUMN "txId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Postback_txId_key" ON "Postback"("txId");

-- CreateIndex
CREATE INDEX "Signal_createdAt_idx" ON "Signal"("createdAt");
