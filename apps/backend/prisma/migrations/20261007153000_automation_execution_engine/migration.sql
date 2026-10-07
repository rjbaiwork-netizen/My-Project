-- Automation execution engine: approvals, step state, and retry counters
ALTER TYPE "AIJobStatus" ADD VALUE IF NOT EXISTS 'APPROVAL_REQUIRED';

ALTER TABLE "AIAutomation"
  ADD COLUMN "approval" JSONB;

ALTER TABLE "AIAutomationRun"
  ADD COLUMN "steps" JSONB,
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "maxAttempts" INTEGER NOT NULL DEFAULT 3;
