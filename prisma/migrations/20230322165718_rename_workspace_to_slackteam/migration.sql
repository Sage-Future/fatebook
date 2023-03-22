/*
  Warnings:

  - You are about to drop the column `workspaceId` on the `Group` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Group" DROP COLUMN "workspaceId",
ADD COLUMN     "slackTeamId" TEXT;
