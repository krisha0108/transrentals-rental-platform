-- Migration: add_vendor_direct_booking_expenses
-- Creates the vendor_direct_booking_expenses table for per-booking expense tracking.
-- Safe to run on both fresh and existing deployments.
-- Compatible with MySQL 5.7+ (uses INFORMATION_SCHEMA checks instead of
-- DROP FOREIGN KEY IF EXISTS which is MariaDB-only syntax).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `vendor_direct_booking_expenses` (
    `id`          VARCHAR(191)  NOT NULL,
    `bookingId`   VARCHAR(191)  NOT NULL,
    `vendorId`    VARCHAR(191)  NOT NULL,
    `category`    VARCHAR(191)  NOT NULL,
    `amount`      DOUBLE        NOT NULL,
    `note`        LONGTEXT      NULL,
    `expenseDate` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`   DATETIME(3)   NOT NULL,

    INDEX `vendor_direct_booking_expenses_bookingId_idx`(`bookingId`),
    INDEX `vendor_direct_booking_expenses_vendorId_idx`(`vendorId`),
    INDEX `vendor_direct_booking_expenses_expenseDate_idx`(`expenseDate`),
    INDEX `vendor_direct_booking_expenses_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Foreign key constraints
--    Drop if exists (via INFORMATION_SCHEMA check) then re-add.
--    Compatible with MySQL 5.7+ — no DROP FOREIGN KEY IF EXISTS (MariaDB-only).
-- ─────────────────────────────────────────────────────────────────────────────

-- expenses → vendor_direct_bookings (cascade delete)
SET @sql = (SELECT IF(COUNT(*) > 0, 'ALTER TABLE `vendor_direct_booking_expenses` DROP FOREIGN KEY `vendor_direct_booking_expenses_bookingId_fkey`', 'SELECT 1') FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_direct_booking_expenses' AND CONSTRAINT_NAME = 'vendor_direct_booking_expenses_bookingId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;
ALTER TABLE `vendor_direct_booking_expenses`
    ADD CONSTRAINT `vendor_direct_booking_expenses_bookingId_fkey`
    FOREIGN KEY (`bookingId`) REFERENCES `vendor_direct_bookings`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- expenses → vendors
SET @sql = (SELECT IF(COUNT(*) > 0, 'ALTER TABLE `vendor_direct_booking_expenses` DROP FOREIGN KEY `vendor_direct_booking_expenses_vendorId_fkey`', 'SELECT 1') FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_direct_booking_expenses' AND CONSTRAINT_NAME = 'vendor_direct_booking_expenses_vendorId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;
ALTER TABLE `vendor_direct_booking_expenses`
    ADD CONSTRAINT `vendor_direct_booking_expenses_vendorId_fkey`
    FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
