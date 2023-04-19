-- CreateTable
CREATE TABLE "PingSlackMessage" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "detailsId" INTEGER NOT NULL,

    CONSTRAINT "PingSlackMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PingSlackMessage_detailsId_key" ON "PingSlackMessage"("detailsId");

-- AddForeignKey
ALTER TABLE "PingSlackMessage" ADD CONSTRAINT "PingSlackMessage_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PingSlackMessage" ADD CONSTRAINT "PingSlackMessage_detailsId_fkey" FOREIGN KEY ("detailsId") REFERENCES "SlackMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
