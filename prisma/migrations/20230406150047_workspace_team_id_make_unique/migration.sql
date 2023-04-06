/*
  Warnings:

  - A unique constraint covering the columns `[teamId]` on the table `Workspace` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Workspace_teamId_key" ON "Workspace"("teamId");
