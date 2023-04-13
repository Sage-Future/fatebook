/*
  Warnings:

  - You are about to drop the column `score` on the `QuestionScore` table. All the data in the column will be lost.
  - Added the required column `absoluteScore` to the `QuestionScore` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rank` to the `QuestionScore` table without a default value. This is not possible if the table is not empty.
  - Added the required column `relativeScore` to the `QuestionScore` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "QuestionScore" RENAME COLUMN "score" TO "relativeScore";
ALTER TABLE "QuestionScore" ADD    COLUMN "absoluteScore" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "rank" INTEGER NOT NULL DEFAULT 0;
