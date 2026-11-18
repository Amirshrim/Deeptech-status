-- CreateTable
CREATE TABLE "LectureSlot" (
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "topic" TEXT,
    "email" TEXT,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "cancelToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LectureSlot_pkey" PRIMARY KEY ("date")
);

-- CreateIndex
CREATE INDEX "LectureSlot_email_idx" ON "LectureSlot"("email");
