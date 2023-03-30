-- CreateTable
CREATE TABLE "QuestionSlackMessage" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "ts" TEXT NOT NULL,
    "channel" TEXT NOT NULL,

    CONSTRAINT "QuestionSlackMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuestionSlackMessage" ADD CONSTRAINT "QuestionSlackMessage_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
