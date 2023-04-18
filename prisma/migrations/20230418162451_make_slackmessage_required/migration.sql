/*
  Warnings:

  - You are about to drop the column `channel` on the `QuestionSlackMessage` table. All the data in the column will be lost.
  - You are about to drop the column `ts` on the `QuestionSlackMessage` table. All the data in the column will be lost.
  - Made the column `detailsId` on table `QuestionSlackMessage` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "QuestionSlackMessage" DROP COLUMN "channel",
DROP COLUMN "ts",
ALTER COLUMN "detailsId" SET NOT NULL;
