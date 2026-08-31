-- AlterTable
ALTER TABLE `vendor_partnership_agreements` ADD COLUMN `termMonths` INT NOT NULL DEFAULT 12 AFTER `queryNote`;
