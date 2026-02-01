/*
  Warnings:

  - A unique constraint covering the columns `[thesisId]` on the table `ThesisPresentationAnnouncement` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ThesisPresentationAnnouncement_thesisId_key" ON "ThesisPresentationAnnouncement"("thesisId");
