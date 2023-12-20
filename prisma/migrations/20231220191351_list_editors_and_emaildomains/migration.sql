-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "anyoneInListCanEdit" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserList" ADD COLUMN     "emailDomains" TEXT[];
