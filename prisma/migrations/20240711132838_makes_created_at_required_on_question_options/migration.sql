/*
  Warnings:

  - Made the column `createdAt` on table `QuestionOption` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "QuestionOption" ALTER COLUMN "createdAt" SET NOT NULL;
