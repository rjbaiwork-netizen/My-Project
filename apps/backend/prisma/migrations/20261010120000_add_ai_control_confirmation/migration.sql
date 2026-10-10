CREATE TABLE "AIControlConfirmation" (
  "id" TEXT NOT NULL,
  "action" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIControlConfirmation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIControlConfirmation_expiresAt_consumedAt_idx"
  ON "AIControlConfirmation"("expiresAt", "consumedAt");
