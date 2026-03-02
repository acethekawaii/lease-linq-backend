-- CreateEnum
CREATE TYPE "RateType" AS ENUM ('HOURLY', 'OVERNIGHT', 'MONTHLY');

-- AlterTable
ALTER TABLE "parking_sessions" ADD COLUMN     "monthly_end" TIMESTAMP(3),
ADD COLUMN     "monthly_start" TIMESTAMP(3),
ADD COLUMN     "rate_type" "RateType" DEFAULT 'HOURLY';
