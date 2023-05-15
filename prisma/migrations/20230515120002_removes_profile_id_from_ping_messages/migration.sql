/*
  Warnings:

  - You are about to drop the column `profileId` on the `PingSlackMessage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PingSlackMessage" DROP CONSTRAINT "PingSlackMessage_profileId_fkey";

-- AlterTable
ALTER TABLE "PingSlackMessage" DROP COLUMN "profileId";
