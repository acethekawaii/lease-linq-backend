/*
  Warnings:

  - Made the column `rate_type` on table `parking_sessions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ParkingState" ADD VALUE 'INACTIVE';
ALTER TYPE "ParkingState" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "parking_sessions" ALTER COLUMN "rate_type" SET NOT NULL;
