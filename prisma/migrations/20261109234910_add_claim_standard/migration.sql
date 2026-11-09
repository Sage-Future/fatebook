-- CreateEnum
CREATE TYPE "ClaimShape" AS ENUM ('NUMBER_BY_DATE', 'EVENT_BY_DATE', 'A_BEATS_B', 'RANK_OR_AWARD', 'FREE_TEXT');

-- CreateEnum
CREATE TYPE "ConfidenceWord" AS ENUM ('ALMOST_CERTAIN', 'VERY_LIKELY', 'LIKELY', 'TOSS_UP', 'UNLIKELY', 'VERY_UNLIKELY', 'ALMOST_NO_CHANCE');

-- AlterTable
ALTER TABLE "Forecast" ADD COLUMN     "confidenceWord" "ConfidenceWord";

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "actualResult" TEXT,
ADD COLUMN     "approximate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "checkLinkConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "checkLinkUrl" TEXT,
ADD COLUMN     "claimDate" TIMESTAMP(3),
ADD COLUMN     "claimShape" "ClaimShape",
ADD COLUMN     "closeCall" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "confidenceWord" "ConfidenceWord",
ADD COLUMN     "engineQuestionsAsked" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "grade" INTEGER,
ADD COLUMN     "outcomeParts" JSONB,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "withdrawnAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ClaimVersion" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "changedFields" TEXT[],
    "state" JSONB NOT NULL,
    "prevHash" TEXT,
    "hash" TEXT NOT NULL,

    CONSTRAINT "ClaimVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClaimVersion_questionId_version_key" ON "ClaimVersion"("questionId", "version");

-- CreateIndex
CREATE INDEX "Question_parentId_idx" ON "Question"("parentId");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimVersion" ADD CONSTRAINT "ClaimVersion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimVersion" ADD CONSTRAINT "ClaimVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Hand-written additions (Prisma cannot express these in schema.prisma)

-- A grade is always 1 to 5
ALTER TABLE "Question" ADD CONSTRAINT "Question_grade_check" CHECK ("grade" IS NULL OR ("grade" >= 1 AND "grade" <= 5));

-- ClaimVersion is append-only: reject any UPDATE or DELETE at the database level,
-- so history cannot be rewritten through the app even by mistake.
CREATE FUNCTION "ClaimVersion_append_only"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'ClaimVersion is append-only: % is not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "ClaimVersion_no_update_or_delete"
  BEFORE UPDATE OR DELETE ON "ClaimVersion"
  FOR EACH ROW EXECUTE FUNCTION "ClaimVersion_append_only"();
