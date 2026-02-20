-- Migration: add_vendor_direct_booking_expenses
-- Creates the vendor_direct_booking_expenses table for per-booking expense tracking.
-- Safe to run on both fresh and existing deployments (IF NOT EXISTS throughout).

-- ─────────────────────────────────────────────────────────────────────────────
-- Create table
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
-- Foreign key constraints (DROP IF EXISTS first for idempotency)
-- ─────────────────────────────────────────────────────────────────────────────

-- expenses → vendor_direct_bookings (cascade delete: expense removed if booking deleted)
ALTER TABLE `vendor_direct_booking_expenses`
    DROP FOREIGN KEY IF EXISTS `vendor_direct_booking_expenses_bookingId_fkey`;
ALTER TABLE `vendor_direct_booking_expenses`
    ADD CONSTRAINT `vendor_direct_booking_expenses_bookingId_fkey`
    FOREIGN KEY (`bookingId`) REFERENCES `vendor_direct_bookings`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- expenses → vendors
ALTER TABLE `vendor_direct_booking_expenses`
    DROP FOREIGN KEY IF EXISTS `vendor_direct_booking_expenses_vendorId_fkey`;
ALTER TABLE `vendor_direct_booking_expenses`
    ADD CONSTRAINT `vendor_direct_booking_expenses_vendorId_fkey`
    FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
