-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "syncToSlackChannelId" TEXT,
ADD COLUMN     "syncToSlackTeamId" TEXT;

-- AlterTable
ALTER TABLE "UserList" ADD COLUMN     "syncToSlackChannelId" TEXT,
ADD COLUMN     "syncToSlackTeamId" TEXT;
