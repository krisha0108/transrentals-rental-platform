-- AlterTable
ALTER TABLE `manager_call_reports` ADD COLUMN `companyName` varchar(191) DEFAULT NULL AFTER `vendorName`;
ALTER TABLE `manager_call_reports` ADD COLUMN `companyDetails` text DEFAULT NULL AFTER `companyName`;
ALTER TABLE `manager_call_reports` ADD COLUMN `address` varchar(191) DEFAULT NULL AFTER `phone`;
