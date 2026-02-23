-- AlterTable: Add commissionPercent to vendor_approved_services
ALTER TABLE `vendor_approved_services` ADD COLUMN `commissionPercent` DOUBLE NOT NULL DEFAULT 0;
