CREATE TYPE "SectionKey" AS ENUM ('HEADER','HERO','ABOUT','SERVICES','PORTFOLIO','PRICING','TESTIMONIALS','BLOG','CONTACT','FOOTER');

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
CREATE INDEX "CMSSection_isVisible_order_idx" ON "CMSSection"("isVisible","order");
