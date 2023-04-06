-- CreateTable
CREATE TABLE "Workspace" (
    "teamId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("teamId")
);
