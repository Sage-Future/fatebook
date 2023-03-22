-- AlterTable
ALTER TABLE "Forecast" ADD COLUMN     "pingedForResolution" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resolved" BOOLEAN NOT NULL DEFAULT false;
