/*
  Warnings:

  - Added the required column `resolve_at` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "resolve_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "resolved" BOOLEAN NOT NULL DEFAULT false;
