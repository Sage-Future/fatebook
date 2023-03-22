/*
  Warnings:

  - You are about to drop the column `pingedForResolution` on the `Forecast` table. All the data in the column will be lost.
  - You are about to drop the column `resolved` on the `Forecast` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Forecast" DROP COLUMN "pingedForResolution",
DROP COLUMN "resolved";

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "pingedForResolution" BOOLEAN NOT NULL DEFAULT false;
