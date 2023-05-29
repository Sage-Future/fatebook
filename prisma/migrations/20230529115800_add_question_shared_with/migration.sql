-- CreateTable
CREATE TABLE "_questionsSharedWith" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_questionsSharedWith_AB_unique" ON "_questionsSharedWith"("A", "B");

-- CreateIndex
CREATE INDEX "_questionsSharedWith_B_index" ON "_questionsSharedWith"("B");

-- AddForeignKey
ALTER TABLE "_questionsSharedWith" ADD CONSTRAINT "_questionsSharedWith_A_fkey" FOREIGN KEY ("A") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_questionsSharedWith" ADD CONSTRAINT "_questionsSharedWith_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
