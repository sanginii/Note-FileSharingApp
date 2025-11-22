-- AlterTable
ALTER TABLE "SecureNote" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "SecureNote" ADD COLUMN "salt" TEXT;
