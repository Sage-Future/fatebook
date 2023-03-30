/*
  Warnings:

  - You are about to drop the column `score` on the `Forecast` table. All the data in the column will be lost.
  - You are about to drop the column `scored` on the `Forecast` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Forecast" DROP COLUMN "score",
DROP COLUMN "scored";
