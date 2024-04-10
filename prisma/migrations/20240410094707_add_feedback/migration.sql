-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "email" TEXT,
    "userId" TEXT,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);
