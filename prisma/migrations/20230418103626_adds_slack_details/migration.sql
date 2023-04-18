-- CreateTable
CREATE TABLE "SlackMessageDetails" (
    "id" SERIAL NOT NULL,
    "ts" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "SlackMessageDetails_pkey" PRIMARY KEY ("id")
);
