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
