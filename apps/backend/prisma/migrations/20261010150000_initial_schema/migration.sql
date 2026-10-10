-- Initial PostgreSQL schema for the complete Prisma data model.
-- Generated as a checked-in migration so fresh databases can be initialized
-- by `prisma migrate deploy`. Do not apply blindly to a database that already
-- contains these tables without first baselining its migration history.

CREATE TYPE "SectionKey" AS ENUM ('HEADER', 'HERO', 'ABOUT', 'SERVICES', 'PORTFOLIO', 'PRICING', 'TESTIMONIALS', 'BLOG', 'CONTACT', 'FOOTER');
CREATE TYPE "AIAgentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED');
CREATE TYPE "AIJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'APPROVAL_REQUIRED');
CREATE TYPE "AIAutomationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DRAFT');
CREATE TYPE "AIProviderConnectionStatus" AS ENUM ('DISCONNECTED', 'AUTHORIZING', 'CONNECTED', 'ERROR', 'REVOKED');

CREATE TABLE "CMSSection" (
  "id" TEXT NOT NULL,
  "key" "SectionKey" NOT NULL,
  "title" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CMSSection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CMSSection_key_key" ON "CMSSection"("key");
CREATE INDEX "CMSSection_isVisible_idx" ON "CMSSection"("isVisible");
CREATE INDEX "CMSSection_order_idx" ON "CMSSection"("order");
CREATE INDEX "CMSSection_isVisible_order_idx" ON "CMSSection"("isVisible", "order");

CREATE TABLE "AIAgent" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "systemPrompt" TEXT NOT NULL,
  "status" "AIAgentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIAgent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AIAgent_key_key" ON "AIAgent"("key");

CREATE TABLE "AIConversation" (
  "id" TEXT NOT NULL,
  "title" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AIMessage_conversationId_createdAt_idx" ON "AIMessage"("conversationId", "createdAt");

CREATE TABLE "AIMemory" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT,
  "namespace" TEXT NOT NULL DEFAULT 'default',
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "embedding" JSONB,
  "embeddingProvider" TEXT DEFAULT 'openai',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIMemory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AIMemory_namespace_createdAt_idx" ON "AIMemory"("namespace", "createdAt");

CREATE TABLE "AIAgentMemory" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "memoryId" TEXT NOT NULL,
  "categoryId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIAgentMemory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AIAgentMemory_agentId_memoryId_key" ON "AIAgentMemory"("agentId", "memoryId");
CREATE INDEX "AIAgentMemory_agentId_categoryId_idx" ON "AIAgentMemory"("agentId", "categoryId");

CREATE TABLE "AIKnowledgeDocument" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "source" TEXT,
  "metadata" JSONB,
  "embedding" JSONB,
  "embeddingProvider" TEXT DEFAULT 'openai',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIKnowledgeDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AIKnowledgeDocument_createdAt_idx" ON "AIKnowledgeDocument"("createdAt");

CREATE TABLE "AIAgentKnowledge" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "knowledgeId" TEXT NOT NULL,
  "categoryId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIAgentKnowledge_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AIAgentKnowledge_agentId_knowledgeId_key" ON "AIAgentKnowledge"("agentId", "knowledgeId");
CREATE INDEX "AIAgentKnowledge_agentId_categoryId_idx" ON "AIAgentKnowledge"("agentId", "categoryId");

CREATE TABLE "AIAgentRun" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "status" "AIJobStatus" NOT NULL DEFAULT 'QUEUED',
  "input" JSONB,
  "output" JSONB,
  "error" TEXT,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIAgentRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AIAgentRun_agentId_createdAt_idx" ON "AIAgentRun"("agentId", "createdAt");

CREATE TABLE "AIJob" (
  "id" TEXT NOT NULL,
  "agentId" TEXT,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "AIJobStatus" NOT NULL DEFAULT 'QUEUED',
  "scheduledAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIJob_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AIJob_status_scheduledAt_idx" ON "AIJob"("status", "scheduledAt");
CREATE INDEX "AIJob_agentId_createdAt_idx" ON "AIJob"("agentId", "createdAt");

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
CREATE UNIQUE INDEX "AIAgentBrainCategory_agentId_key_key" ON "AIAgentBrainCategory"("agentId", "key");
CREATE INDEX "AIAgentBrainCategory_agentId_updatedAt_idx" ON "AIAgentBrainCategory"("agentId", "updatedAt");

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
CREATE INDEX "AIBrainMetric_categoryId_metricDate_idx" ON "AIBrainMetric"("categoryId", "metricDate");

CREATE TABLE "AIAutomation" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "AIAutomationStatus" NOT NULL DEFAULT 'DRAFT',
  "trigger" JSONB NOT NULL,
  "conditions" JSONB,
  "actions" JSONB NOT NULL,
  "agentId" TEXT,
  "approval" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIAutomation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AIAutomation_status_updatedAt_idx" ON "AIAutomation"("status", "updatedAt");
CREATE INDEX "AIAutomation_agentId_updatedAt_idx" ON "AIAutomation"("agentId", "updatedAt");

CREATE TABLE "AIAutomationRun" (
  "id" TEXT NOT NULL,
  "automationId" TEXT NOT NULL,
  "status" "AIJobStatus" NOT NULL DEFAULT 'QUEUED',
  "input" JSONB,
  "output" JSONB,
  "error" TEXT,
  "steps" JSONB,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIAutomationRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AIAutomationRun_automationId_createdAt_idx" ON "AIAutomationRun"("automationId", "createdAt");

CREATE TABLE "AdminWorkspaceSettings" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL DEFAULT 'singleton',
  "displayName" TEXT NOT NULL DEFAULT 'Administrator',
  "email" TEXT NOT NULL DEFAULT '',
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "theme" TEXT NOT NULL DEFAULT 'system',
  "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminWorkspaceSettings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AdminWorkspaceSettings_key_key" ON "AdminWorkspaceSettings"("key");

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
CREATE INDEX "AIProviderEvent_provider_createdAt_idx" ON "AIProviderEvent"("provider", "createdAt");
CREATE INDEX "AIProviderEvent_success_createdAt_idx" ON "AIProviderEvent"("success", "createdAt");
CREATE INDEX "AIProviderEvent_purpose_createdAt_idx" ON "AIProviderEvent"("purpose", "createdAt");

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

ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIMemory" ADD CONSTRAINT "AIMemory_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIAgentMemory" ADD CONSTRAINT "AIAgentMemory_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIAgentMemory" ADD CONSTRAINT "AIAgentMemory_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "AIMemory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIAgentMemory" ADD CONSTRAINT "AIAgentMemory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AIAgentBrainCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIAgentKnowledge" ADD CONSTRAINT "AIAgentKnowledge_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIAgentKnowledge" ADD CONSTRAINT "AIAgentKnowledge_knowledgeId_fkey" FOREIGN KEY ("knowledgeId") REFERENCES "AIKnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIAgentKnowledge" ADD CONSTRAINT "AIAgentKnowledge_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AIAgentBrainCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIAgentRun" ADD CONSTRAINT "AIAgentRun_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIJob" ADD CONSTRAINT "AIJob_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIAgentBrainCategory" ADD CONSTRAINT "AIAgentBrainCategory_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIBrainMetric" ADD CONSTRAINT "AIBrainMetric_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AIAgentBrainCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIAutomation" ADD CONSTRAINT "AIAutomation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIAutomationRun" ADD CONSTRAINT "AIAutomationRun_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "AIAutomation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
