-- CreateEnum
CREATE TYPE "Status" AS ENUM ('NEW', 'REGISTERED', 'DEPOSITED', 'VIP');

-- CreateEnum
CREATE TYPE "Strategy" AS ENUM ('stable', 'moderate', 'aggressive');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "onewinId" TEXT,
    "status" "Status" NOT NULL DEFAULT 'NEW',
    "hasDeposit" BOOLEAN NOT NULL DEFAULT false,
    "totalDeposit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "depositCount" INTEGER NOT NULL DEFAULT 0,
    "signalsUsed" INTEGER NOT NULL DEFAULT 0,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "withdrawalTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lastBalanceAt" TIMESTAMP(3),
    "onewinRegisteredAt" TIMESTAMP(3),
    "blockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Postback" (
    "id" SERIAL NOT NULL,
    "eventType" TEXT NOT NULL,
    "onewinId" TEXT NOT NULL,
    "amount" DECIMAL(12,2),
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Postback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signal" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "strategy" "Strategy" NOT NULL,
    "dominoes" INTEGER NOT NULL,
    "coefficient" DECIMAL(5,2) NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "betAmount" DECIMAL(12,2) NOT NULL,
    "result" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Signal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "referralUrl" TEXT NOT NULL DEFAULT '',
    "channelUrl" TEXT NOT NULL DEFAULT '',
    "promoCode" TEXT NOT NULL DEFAULT '',
    "botName" TEXT NOT NULL DEFAULT 'Tower Rush',
    "supportContact" TEXT NOT NULL DEFAULT '',
    "botVersion" TEXT NOT NULL DEFAULT '1.0.0',

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Broadcast" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "photoFileId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "processing" BOOLEAN NOT NULL DEFAULT false,
    "adminId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "User_onewinId_key" ON "User"("onewinId");

-- CreateIndex
CREATE INDEX "Postback_onewinId_idx" ON "Postback"("onewinId");

-- CreateIndex
CREATE INDEX "Signal_userId_idx" ON "Signal"("userId");

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

