-- Backfills a missing migration, same class of gap as
-- 20260726235959_create_manager_action_logs_table: `vendor_bank_accounts`
-- exists in schema.prisma and in every dev database (created via
-- `prisma db push`) but was never captured in a migration file, so a
-- database built purely from `prisma migrate deploy` is missing it
-- entirely. IF NOT EXISTS makes this a safe no-op where the table already
-- exists.

CREATE TABLE IF NOT EXISTS `vendor_bank_accounts` (
  `id` VARCHAR(191) NOT NULL,
  `vendorId` VARCHAR(191) NOT NULL,
  `bankName` VARCHAR(191) NOT NULL,
  `accountHolderName` VARCHAR(191) NOT NULL,
  `accountNumber` VARCHAR(191) NOT NULL,
  `ifscCode` VARCHAR(191) NOT NULL,
  `accountType` VARCHAR(191) NOT NULL DEFAULT 'SAVINGS',
  `branchName` VARCHAR(191) NULL,
  `upiId` VARCHAR(191) NULL,
  `isPrimary` BOOLEAN NOT NULL DEFAULT false,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `vendor_bank_accounts_vendorId_idx` (`vendorId`),
  INDEX `vendor_bank_accounts_isPrimary_idx` (`isPrimary`),

  CONSTRAINT `vendor_bank_accounts_vendorId_fkey`
    FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
