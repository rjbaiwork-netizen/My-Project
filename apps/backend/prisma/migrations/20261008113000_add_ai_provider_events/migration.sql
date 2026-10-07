CREATE TABLE "AIProviderEvent" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "statusCode" INTEGER,
  "model" TEXT,
  "error" TEXT,
  "fallbackFrom" TEXT,
  "latencyMs" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIProviderEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AIProviderEvent_provider_createdAt_idx" ON "AIProviderEvent"("provider","createdAt");
CREATE INDEX "AIProviderEvent_success_createdAt_idx" ON "AIProviderEvent"("success","createdAt");
CREATE INDEX "AIProviderEvent_purpose_createdAt_idx" ON "AIProviderEvent"("purpose","createdAt");