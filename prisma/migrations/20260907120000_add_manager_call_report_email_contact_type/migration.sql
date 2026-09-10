-- AlterTable
ALTER TABLE `manager_call_reports`
  ADD COLUMN `email` VARCHAR(191) NULL,
  ADD COLUMN `contactType` ENUM('VENDOR', 'TRAVEL_AGENT') NOT NULL DEFAULT 'VENDOR';
