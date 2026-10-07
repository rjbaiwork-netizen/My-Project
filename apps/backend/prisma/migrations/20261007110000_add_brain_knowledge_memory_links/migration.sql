CREATE TABLE "AIAgentKnowledge" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "knowledgeId" TEXT NOT NULL,
  "categoryId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIAgentKnowledge_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AIAgentMemory" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "memoryId" TEXT NOT NULL,
  "categoryId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIAgentMemory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AIAgentKnowledge_agentId_knowledgeId_key" ON "AIAgentKnowledge"("agentId","knowledgeId");
CREATE INDEX "AIAgentKnowledge_agentId_categoryId_idx" ON "AIAgentKnowledge"("agentId","categoryId");
CREATE UNIQUE INDEX "AIAgentMemory_agentId_memoryId_key" ON "AIAgentMemory"("agentId","memoryId");
CREATE INDEX "AIAgentMemory_agentId_categoryId_idx" ON "AIAgentMemory"("agentId","categoryId");
ALTER TABLE "AIAgentKnowledge" ADD CONSTRAINT "AIAgentKnowledge_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIAgentKnowledge" ADD CONSTRAINT "AIAgentKnowledge_knowledgeId_fkey" FOREIGN KEY ("knowledgeId") REFERENCES "AIKnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIAgentKnowledge" ADD CONSTRAINT "AIAgentKnowledge_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AIAgentBrainCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIAgentMemory" ADD CONSTRAINT "AIAgentMemory_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIAgentMemory" ADD CONSTRAINT "AIAgentMemory_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "AIMemory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIAgentMemory" ADD CONSTRAINT "AIAgentMemory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AIAgentBrainCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;