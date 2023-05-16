/*

*/
-- AlterTable Forecast
ALTER TABLE "Forecast"
RENAME COLUMN "authorId" TO "profileId";
ALTER TABLE "Forecast"
ADD COLUMN     "userId" INTEGER;

-- AlterTable Question
ALTER TABLE "Question"
RENAME COLUMN "authorId" TO "profileId";

-- AlterTable QuestionScore
DROP INDEX "QuestionScore_profileQuestionComboId_key";

ALTER TABLE "QuestionScore" DROP COLUMN "profileQuestionComboId",
ADD COLUMN     "userQuestionComboId" TEXT;

-- Adding userId to tables

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "userId" INTEGER;

-- AlterTable
ALTER TABLE "QuestionScore" ADD COLUMN     "userId" INTEGER;

-- AddForeignKey
ALTER TABLE "Forecast" ADD CONSTRAINT "Forecast_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionScore" ADD CONSTRAINT "QuestionScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Populate the user column from profile
UPDATE "Forecast" SET "userId" = "Profile"."userId" FROM "Profile" WHERE "Forecast"."profileId" = "Profile"."id";
UPDATE "Question" SET "userId" = "Profile"."userId" FROM "Profile" WHERE "Question"."profileId" = "Profile"."id";
UPDATE "QuestionScore" SET "userId" = "Profile"."userId" FROM "Profile" WHERE "QuestionScore"."profileId" = "Profile"."id";
-- populate userQuestionComboId with concatentation of userId and questionId
UPDATE "QuestionScore" SET "userQuestionComboId" = "userId" || '-' || "questionId";


-- Set the user column as required
ALTER TABLE "Forecast" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Question" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "QuestionScore" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "QuestionScore" ALTER COLUMN "userQuestionComboId" SET NOT NULL;
CREATE UNIQUE INDEX "QuestionScore_userQuestionComboId_key" ON "QuestionScore"("userQuestionComboId");


-- DropForeignKey
ALTER TABLE "QuestionScore" DROP CONSTRAINT "QuestionScore_profileId_fkey";
-- AlterTable
ALTER TABLE "QuestionScore" DROP COLUMN "profileId";
