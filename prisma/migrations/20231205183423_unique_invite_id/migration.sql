/*
  Warnings:

  - A unique constraint covering the columns `[inviteId]` on the table `UserList` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserList_inviteId_key" ON "UserList"("inviteId");
