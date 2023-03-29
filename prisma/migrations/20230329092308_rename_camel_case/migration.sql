/*
  Warnings:

  - You are about to drop the column `resolve_by` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `resolved_at` on the `Question` table. All the data in the column will be lost.
  - Added the required column `resolveBy` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Question" RENAME COLUMN "resolve_by" TO "resolveBy";
ALTER TABLE "Question" RENAME COLUMN "resolved_at" TO "resolvedAt";
