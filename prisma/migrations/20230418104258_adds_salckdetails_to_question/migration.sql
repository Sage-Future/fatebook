/*
  Warnings:

  - A unique constraint covering the columns `[detailsId]` on the table `QuestionSlackMessage` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "QuestionSlackMessage" ADD COLUMN     "detailsId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "QuestionSlackMessage_detailsId_key" ON "QuestionSlackMessage"("detailsId");

-- AddForeignKey
ALTER TABLE "QuestionSlackMessage" ADD CONSTRAINT "QuestionSlackMessage_detailsId_fkey" FOREIGN KEY ("detailsId") REFERENCES "SlackMessageDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
