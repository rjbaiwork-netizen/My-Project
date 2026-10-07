CREATE TYPE "AIAutomationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DRAFT');

CREATE TABLE "AIAgentBrainCategory" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "dataCount" INTEGER NOT NULL DEFAULT 0,
  "memoryCount" INTEGER NOT NULL DEFAULT 0,
  "knowledgeCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIAgentBrainCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIBrainMetric" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "metricDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "progress" INTEGER NOT NULL,
  "dataCount" INTEGER NOT NULL DEFAULT 0,
  "memoryCount" INTEGER NOT NULL DEFAULT 0,
  "knowledgeCount" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "AIBrainMetric_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIAutomation" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "AIAutomationStatus" NOT NULL DEFAULT 'DRAFT',
  "trigger" JSONB NOT NULL,
  "conditions" JSONB,
  "actions" JSONB NOT NULL,
  "agentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIAutomation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIAutomationRun" (
  "id" TEXT NOT NULL,
  "automationId" TEXT NOT NULL,
  "status" "AIJobStatus" NOT NULL DEFAULT 'QUEUED',
  "input" JSONB,
  "output" JSONB,
  "error" TEXT,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIAutomationRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AIAgentBrainCategory_agentId_key_key" ON "AIAgentBrainCategory"("agentId", "key");
CREATE INDEX "AIAgentBrainCategory_agentId_updatedAt_idx" ON "AIAgentBrainCategory"("agentId", "updatedAt");
CREATE INDEX "AIBrainMetric_categoryId_metricDate_idx" ON "AIBrainMetric"("categoryId", "metricDate");
CREATE INDEX "AIAutomation_status_updatedAt_idx" ON "AIAutomation"("status", "updatedAt");
CREATE INDEX "AIAutomation_agentId_updatedAt_idx" ON "AIAutomation"("agentId", "updatedAt");
CREATE INDEX "AIAutomationRun_automationId_createdAt_idx" ON "AIAutomationRun"("automationId", "createdAt");

ALTER TABLE "AIAgentBrainCategory" ADD CONSTRAINT "AIAgentBrainCategory_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIBrainMetric" ADD CONSTRAINT "AIBrainMetric_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AIAgentBrainCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIAutomation" ADD CONSTRAINT "AIAutomation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIAutomationRun" ADD CONSTRAINT "AIAutomationRun_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "AIAutomation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
