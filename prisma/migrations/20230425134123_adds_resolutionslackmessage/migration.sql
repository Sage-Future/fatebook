-- CreateTable
CREATE TABLE "ResolutionSlackMessage" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "detailsId" INTEGER NOT NULL,

    CONSTRAINT "ResolutionSlackMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResolutionSlackMessage_detailsId_key" ON "ResolutionSlackMessage"("detailsId");

-- AddForeignKey
ALTER TABLE "ResolutionSlackMessage" ADD CONSTRAINT "ResolutionSlackMessage_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResolutionSlackMessage" ADD CONSTRAINT "ResolutionSlackMessage_detailsId_fkey" FOREIGN KEY ("detailsId") REFERENCES "SlackMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
