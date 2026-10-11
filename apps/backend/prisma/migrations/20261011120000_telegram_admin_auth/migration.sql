CREATE TYPE "AdminLoginRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'EXPIRED');

CREATE TABLE "AdminLoginRequest" (
  "id" TEXT NOT NULL,
  "pollTokenHash" TEXT NOT NULL,
  "sessionTokenHash" TEXT NOT NULL,
  "deviceLabel" TEXT NOT NULL,
  "ipHash" TEXT,
  "status" "AdminLoginRequestStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "approvedAt" TIMESTAMP(3),
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminLoginRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminSession" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "loginRequestId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "deviceLabel" TEXT NOT NULL,
  "ipHash" TEXT,
  CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminSecurityEvent" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "detail" JSONB,
  "ipHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminSecurityEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");
CREATE UNIQUE INDEX "AdminSession_loginRequestId_key" ON "AdminSession"("loginRequestId");
CREATE INDEX "AdminLoginRequest_status_expiresAt_idx" ON "AdminLoginRequest"("status", "expiresAt");
CREATE INDEX "AdminLoginRequest_createdAt_idx" ON "AdminLoginRequest"("createdAt");
CREATE INDEX "AdminSession_revokedAt_expiresAt_idx" ON "AdminSession"("revokedAt", "expiresAt");
CREATE INDEX "AdminSession_lastActivityAt_idx" ON "AdminSession"("lastActivityAt");
CREATE INDEX "AdminSecurityEvent_eventType_createdAt_idx" ON "AdminSecurityEvent"("eventType", "createdAt");

ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_loginRequestId_fkey"
  FOREIGN KEY ("loginRequestId") REFERENCES "AdminLoginRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
