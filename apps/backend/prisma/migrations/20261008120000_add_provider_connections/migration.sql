-- CreateEnum
CREATE TYPE "AIProviderConnectionStatus" AS ENUM ('DISCONNECTED', 'AUTHORIZING', 'CONNECTED', 'ERROR', 'REVOKED');

-- CreateTable
CREATE TABLE "AIProviderConnection" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "authType" TEXT NOT NULL,
    "status" "AIProviderConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "scopes" JSONB,
    "capabilities" JSONB,
    "secretTargets" JSONB,
    "externalRef" TEXT,
    "lastError" TEXT,
    "connectedAt" TIMESTAMP(3),
    "lastValidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIProviderConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AIProviderConnection_providerId_key" ON "AIProviderConnection"("providerId");
CREATE INDEX "AIProviderConnection_status_updatedAt_idx" ON "AIProviderConnection"("status", "updatedAt");
