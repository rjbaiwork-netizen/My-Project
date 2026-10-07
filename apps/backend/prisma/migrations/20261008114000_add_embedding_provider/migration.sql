ALTER TABLE "AIMemory" ADD COLUMN "embeddingProvider" TEXT DEFAULT 'openai';
ALTER TABLE "AIKnowledgeDocument" ADD COLUMN "embeddingProvider" TEXT DEFAULT 'openai';
CREATE INDEX "AIMemory_embeddingProvider_idx" ON "AIMemory"("embeddingProvider");
CREATE INDEX "AIKnowledgeDocument_embeddingProvider_idx" ON "AIKnowledgeDocument"("embeddingProvider");