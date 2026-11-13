-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "vegetarian" BOOLEAN NOT NULL DEFAULT false,
    "vegan" BOOLEAN NOT NULL DEFAULT false,
    "kosher" BOOLEAN NOT NULL DEFAULT false,
    "celiac" BOOLEAN NOT NULL DEFAULT false,
    "hasAllergy" BOOLEAN NOT NULL DEFAULT false,
    "allergyDetails" TEXT,
    "allergySevere" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE INDEX "RateLimit_resetAt_idx" ON "RateLimit"("resetAt");
