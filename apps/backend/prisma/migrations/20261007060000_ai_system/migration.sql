CREATE TABLE "AIAgent" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "systemPrompt" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
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
CREATE INDEX "AIMessage_conversationId_createdAt_idx" ON "AIMessage"("conversationId","createdAt");

CREATE TABLE "AIMemory" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT,
  "namespace" TEXT NOT NULL DEFAULT 'default',
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "embedding" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIMemory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AIMemory_namespace_createdAt_idx" ON "AIMemory"("namespace","createdAt");

CREATE TABLE "AIKnowledgeDocument" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "source" TEXT,
  "metadata" JSONB,
  "embedding" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIKnowledgeDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AIKnowledgeDocument_createdAt_idx" ON "AIKnowledgeDocument"("createdAt");

CREATE TABLE "AIAgentRun" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "input" JSONB,
  "output" JSONB,
  "error" TEXT,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIAgentRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AIAgentRun_agentId_createdAt_idx" ON "AIAgentRun"("agentId","createdAt");

CREATE TABLE "AIJob" (
  "id" TEXT NOT NULL,
  "agentId" TEXT,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "scheduledAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIJob_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AIJob_status_scheduledAt_idx" ON "AIJob"("status","scheduledAt");
CREATE INDEX "AIJob_agentId_createdAt_idx" ON "AIJob"("agentId","createdAt");

ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIMemory" ADD CONSTRAINT "AIMemory_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIAgentRun" ADD CONSTRAINT "AIAgentRun_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIJob" ADD CONSTRAINT "AIJob_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;