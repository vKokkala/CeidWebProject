-- AlterEnum
ALTER TYPE "InvitationStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "CommitteeInvitation" ALTER COLUMN "Role" SET DEFAULT 'MEMBER';
