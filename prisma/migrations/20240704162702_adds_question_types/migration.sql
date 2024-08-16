-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('BINARY', 'MULTIPLE_CHOICE', 'QUANTITY');

-- AlterTable
ALTER TABLE "Forecast" ADD COLUMN     "optionId" TEXT,
ADD COLUMN     "value" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "maxValue" DOUBLE PRECISION,
ADD COLUMN     "minValue" DOUBLE PRECISION,
ADD COLUMN     "type" "QuestionType" NOT NULL DEFAULT 'BINARY';

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "value" DOUBLE PRECISION,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResolutionValue" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT,
    "value" DOUBLE PRECISION,

    CONSTRAINT "ResolutionValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResolutionValue_questionId_key" ON "ResolutionValue"("questionId");

-- AddForeignKey
ALTER TABLE "Forecast" ADD CONSTRAINT "Forecast_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "QuestionOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResolutionValue" ADD CONSTRAINT "ResolutionValue_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResolutionValue" ADD CONSTRAINT "ResolutionValue_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "QuestionOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
