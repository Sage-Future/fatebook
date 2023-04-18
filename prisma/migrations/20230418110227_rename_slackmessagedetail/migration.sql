/*
  Warnings:

  - You are about to drop the `SlackMessageDetails` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "QuestionSlackMessage" DROP CONSTRAINT "QuestionSlackMessage_detailsId_fkey";

-- DropTable
DROP TABLE "SlackMessageDetails";

-- CreateTable
CREATE TABLE "SlackMessage" (
    "id" SERIAL NOT NULL,
    "ts" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "SlackMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuestionSlackMessage" ADD CONSTRAINT "QuestionSlackMessage_detailsId_fkey" FOREIGN KEY ("detailsId") REFERENCES "SlackMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
