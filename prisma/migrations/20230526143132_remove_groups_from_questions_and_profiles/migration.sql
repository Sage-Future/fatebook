/*
  Warnings:

  - You are about to drop the `_GroupToProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_GroupToQuestion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_GroupToProfile" DROP CONSTRAINT "_GroupToProfile_A_fkey";

-- DropForeignKey
ALTER TABLE "_GroupToProfile" DROP CONSTRAINT "_GroupToProfile_B_fkey";

-- DropForeignKey
ALTER TABLE "_GroupToQuestion" DROP CONSTRAINT "_GroupToQuestion_A_fkey";

-- DropForeignKey
ALTER TABLE "_GroupToQuestion" DROP CONSTRAINT "_GroupToQuestion_B_fkey";

-- DropTable
DROP TABLE "_GroupToProfile";

-- DropTable
DROP TABLE "_GroupToQuestion";
