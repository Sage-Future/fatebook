-- CreateEnum
CREATE TYPE "Resolution" AS ENUM ('YES', 'NO', 'AMBIGUOUS');

-- AlterTable
ALTER TABLE "Forecast" ADD COLUMN     "score" INTEGER,
ADD COLUMN     "scored" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "resolution" "Resolution";
