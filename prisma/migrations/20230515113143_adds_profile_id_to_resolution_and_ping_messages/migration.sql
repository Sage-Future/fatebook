-- AlterTable
ALTER TABLE "PingSlackMessage" ADD COLUMN     "profileId" INTEGER;

-- AlterTable
ALTER TABLE "ResolutionSlackMessage" ADD COLUMN     "profileId" INTEGER;

-- AddForeignKey
ALTER TABLE "ResolutionSlackMessage" ADD CONSTRAINT "ResolutionSlackMessage_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PingSlackMessage" ADD CONSTRAINT "PingSlackMessage_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
