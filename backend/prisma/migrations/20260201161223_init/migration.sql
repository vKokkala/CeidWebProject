/*
  Warnings:

  - You are about to drop the column `assignmentFinalisedAt` on the `Thesis` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Thesis" DROP COLUMN "assignmentFinalisedAt";

-- CreateTable
CREATE TABLE "ThesisPresentationAnnouncement" (
    "id" SERIAL NOT NULL,
    "thesisId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThesisPresentationAnnouncement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ThesisPresentationAnnouncement" ADD CONSTRAINT "ThesisPresentationAnnouncement_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "Thesis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
