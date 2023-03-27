/*
  Warnings:

  - You are about to drop the column `resolve_at` on the `Question` table. All the data in the column will be lost.
  - Added the required column `resolve_by` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Question" RENAME COLUMN "resolve_at" TO "resolve_by";
