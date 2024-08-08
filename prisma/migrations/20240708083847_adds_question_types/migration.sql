/*
  Warnings:

  - You are about to drop the column `maxValue` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `minValue` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the `ResolutionValue` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `QuestionOption` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ResolutionValue" DROP CONSTRAINT "ResolutionValue_optionId_fkey";

-- DropForeignKey
ALTER TABLE "ResolutionValue" DROP CONSTRAINT "ResolutionValue_questionId_fkey";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "maxValue",
DROP COLUMN "minValue";

-- AlterTable
ALTER TABLE "QuestionOption" ADD COLUMN     "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "resolution" "Resolution",
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "ResolutionValue";

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
