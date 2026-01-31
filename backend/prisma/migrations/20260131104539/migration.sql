/*
  Warnings:

  - You are about to drop the column `extendedDescriptionPdf` on the `Topic` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CommitteeRole" AS ENUM ('SUPERVISOR', 'MEMBER');

-- AlterTable
ALTER TABLE "Topic" DROP COLUMN "extendedDescriptionPdf",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isAssigned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pdfFile" BYTEA,
ADD COLUMN     "pdfFileName" TEXT,
ADD COLUMN     "pdfMimeType" TEXT,
ADD COLUMN     "pdfSize" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Secretariat" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Secretariat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentCancellation" (
    "id" SERIAL NOT NULL,
    "generalCommitteeGatheringNumber" INTEGER,
    "generalCommitteeGatheringYear" INTEGER,
    "reason" TEXT NOT NULL,

    CONSTRAINT "AssignmentCancellation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeInvitation" (
    "id" SERIAL NOT NULL,
    "Role" "CommitteeRole" NOT NULL,
    "invitationStatus" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "thesisId" INTEGER NOT NULL,
    "professorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repliedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommitteeInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" SERIAL NOT NULL,
    "criterion1Score" DECIMAL(4,2),
    "criterion2Score" DECIMAL(4,2),
    "criterion3Score" DECIMAL(4,2),
    "criterion4Score" DECIMAL(4,2),
    "criterion5Score" DECIMAL(4,2),
    "totalGrade" DECIMAL(4,2) NOT NULL,
    "comments" TEXT,
    "thesisId" INTEGER NOT NULL,
    "professorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Thesis" (
    "id" SERIAL NOT NULL,
    "status" "ThesisStatus" NOT NULL DEFAULT 'UNDER_ASSIGNMENT',
    "assignmentFinalisedAt" TIMESTAMP(3),
    "officialAssignmentDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "examinationDate" TIMESTAMP(3),
    "examinationMode" "ExamMode",
    "examinationPlace" TEXT,
    "topicId" INTEGER,
    "studentId" INTEGER NOT NULL,
    "professorId" INTEGER,
    "supervisorId" INTEGER NOT NULL,
    "isGradingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "relevantLinks" TEXT[],
    "thesisDocument" BYTEA,
    "nemertisLink" TEXT,
    "finalGrade" DECIMAL(4,2),

    CONSTRAINT "Thesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThesisStatusChange" (
    "id" SERIAL NOT NULL,
    "fromStatus" "ThesisStatus",
    "toStatus" "ThesisStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT NOT NULL,
    "notes" TEXT,
    "thesisId" INTEGER NOT NULL,

    CONSTRAINT "ThesisStatusChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThesisNote" (
    "id" SERIAL NOT NULL,
    "note" VARCHAR(300) NOT NULL,
    "thesisId" INTEGER NOT NULL,
    "professorId" INTEGER NOT NULL,

    CONSTRAINT "ThesisNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeMember" (
    "id" SERIAL NOT NULL,
    "role" "CommitteeRole" NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "thesisId" INTEGER NOT NULL,
    "professorId" INTEGER NOT NULL,

    CONSTRAINT "CommitteeMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Secretariat_userId_key" ON "Secretariat"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Thesis_topicId_key" ON "Thesis"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "Thesis_studentId_key" ON "Thesis"("studentId");

-- AddForeignKey
ALTER TABLE "Secretariat" ADD CONSTRAINT "Secretariat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeInvitation" ADD CONSTRAINT "CommitteeInvitation_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "Thesis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeInvitation" ADD CONSTRAINT "CommitteeInvitation_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "Thesis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thesis" ADD CONSTRAINT "Thesis_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thesis" ADD CONSTRAINT "Thesis_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thesis" ADD CONSTRAINT "Thesis_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thesis" ADD CONSTRAINT "Thesis_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Professor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThesisStatusChange" ADD CONSTRAINT "ThesisStatusChange_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "Thesis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThesisNote" ADD CONSTRAINT "ThesisNote_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "Thesis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThesisNote" ADD CONSTRAINT "ThesisNote_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "Thesis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
