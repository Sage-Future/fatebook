/*
  Warnings:

  - A unique constraint covering the columns `[profileQuestionComboId]` on the table `QuestionScore` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `profileQuestionComboId` to the `QuestionScore` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "QuestionScore" ADD COLUMN     "profileQuestionComboId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "QuestionScore_profileQuestionComboId_key" ON "QuestionScore"("profileQuestionComboId");
