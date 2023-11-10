-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "authorId" TEXT NOT NULL,
    "sharedPublicly" BOOLEAN NOT NULL DEFAULT false,
    "unlisted" BOOLEAN NOT NULL DEFAULT false,
    "userListId" TEXT,
    "showLeaderboard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_QuestionToTournament" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_QuestionToTournament_AB_unique" ON "_QuestionToTournament"("A", "B");

-- CreateIndex
CREATE INDEX "_QuestionToTournament_B_index" ON "_QuestionToTournament"("B");

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_userListId_fkey" FOREIGN KEY ("userListId") REFERENCES "UserList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuestionToTournament" ADD CONSTRAINT "_QuestionToTournament_A_fkey" FOREIGN KEY ("A") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuestionToTournament" ADD CONSTRAINT "_QuestionToTournament_B_fkey" FOREIGN KEY ("B") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
