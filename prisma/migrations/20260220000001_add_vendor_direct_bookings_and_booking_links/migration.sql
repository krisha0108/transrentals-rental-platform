-- Migration: add_vendor_direct_bookings_and_booking_links
-- Creates vendor_booking_links and vendor_direct_bookings tables.
-- Safe to run on both fresh deployments and existing deployments
-- where these tables were created manually (uses IF NOT EXISTS throughout).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. vendor_booking_links
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `vendor_booking_links` (
    `id`             VARCHAR(191) NOT NULL,
    `vendorId`       VARCHAR(191) NOT NULL,
    `serviceType`    VARCHAR(191) NOT NULL,
    `isActive`       BOOLEAN      NOT NULL DEFAULT true,
    `formTitle`      VARCHAR(191) NULL,
    `welcomeMsg`     LONGTEXT     NULL,
    `visibleFields`  JSON         NULL,
    `requireAdvance` BOOLEAN      NOT NULL DEFAULT false,
    `advanceAmount`  DOUBLE       NULL,
    `clickCount`     INTEGER      NOT NULL DEFAULT 0,
    `bookingCount`   INTEGER      NOT NULL DEFAULT 0,
    `createdAt`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`      DATETIME(3)  NOT NULL,

    UNIQUE INDEX `vendor_booking_links_vendorId_serviceType_key`(`vendorId`, `serviceType`),
    INDEX `vendor_booking_links_vendorId_idx`(`vendorId`),
    INDEX `vendor_booking_links_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. vendor_direct_bookings
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `vendor_direct_bookings` (
    `id`                VARCHAR(191) NOT NULL,
    `bookingNumber`     VARCHAR(191) NOT NULL,
    `vendorId`          VARCHAR(191) NOT NULL,
    `bookingSource`     VARCHAR(191) NOT NULL DEFAULT 'manual',
    `linkId`            VARCHAR(191) NULL,
    `serviceType`       VARCHAR(191) NOT NULL,
    `vehicleType`       VARCHAR(191) NULL,
    `customerName`      VARCHAR(191) NOT NULL,
    `customerPhone`     VARCHAR(191) NOT NULL,
    `customerEmail`     VARCHAR(191) NULL,
    `pickupDate`        DATETIME(3)  NULL,
    `returnDate`        DATETIME(3)  NULL,
    `pickupLocation`    LONGTEXT     NULL,
    `dropLocation`      LONGTEXT     NULL,
    `notes`             LONGTEXT     NULL,
    `status`            VARCHAR(191) NOT NULL DEFAULT 'inquiry',
    `totalAmount`       DOUBLE       NULL,
    `paymentStatus`     VARCHAR(191) NOT NULL DEFAULT 'pending',
    `paymentMode`       VARCHAR(191) NULL,
    `paidAmount`        DOUBLE       NOT NULL DEFAULT 0,
    `razorpayLinkId`    VARCHAR(191) NULL,
    `vendorNotes`       LONGTEXT     NULL,
    `assignedDriverId`  VARCHAR(191) NULL,
    `assignedVehicleId` VARCHAR(191) NULL,
    `assignedAt`        DATETIME(3)  NULL,
    `createdAt`         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`         DATETIME(3)  NOT NULL,

    UNIQUE INDEX `vendor_direct_bookings_bookingNumber_key`(`bookingNumber`),
    INDEX `vendor_direct_bookings_vendorId_idx`(`vendorId`),
    INDEX `vendor_direct_bookings_bookingNumber_idx`(`bookingNumber`),
    INDEX `vendor_direct_bookings_status_idx`(`status`),
    INDEX `vendor_direct_bookings_createdAt_idx`(`createdAt`),
    INDEX `vendor_direct_bookings_bookingSource_idx`(`bookingSource`),
    INDEX `vendor_direct_bookings_assignedDriverId_idx`(`assignedDriverId`),
    INDEX `vendor_direct_bookings_assignedVehicleId_idx`(`assignedVehicleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. For EXISTING deployments: add columns that may be missing
--    (IF NOT EXISTS ensures no error if columns already exist)
-- ─────────────────────────────────────────────────────────────────────────────

-- vendor_booking_links extra columns (in case table exists without them)
ALTER TABLE `vendor_booking_links` ADD COLUMN IF NOT EXISTS `formTitle`      VARCHAR(191) NULL;
ALTER TABLE `vendor_booking_links` ADD COLUMN IF NOT EXISTS `welcomeMsg`     LONGTEXT     NULL;
ALTER TABLE `vendor_booking_links` ADD COLUMN IF NOT EXISTS `visibleFields`  JSON         NULL;
ALTER TABLE `vendor_booking_links` ADD COLUMN IF NOT EXISTS `requireAdvance` BOOLEAN      NOT NULL DEFAULT false;
ALTER TABLE `vendor_booking_links` ADD COLUMN IF NOT EXISTS `advanceAmount`  DOUBLE       NULL;
ALTER TABLE `vendor_booking_links` ADD COLUMN IF NOT EXISTS `clickCount`     INTEGER      NOT NULL DEFAULT 0;
ALTER TABLE `vendor_booking_links` ADD COLUMN IF NOT EXISTS `bookingCount`   INTEGER      NOT NULL DEFAULT 0;

-- vendor_direct_bookings: assignment columns (most likely missing on existing deployments)
ALTER TABLE `vendor_direct_bookings` ADD COLUMN IF NOT EXISTS `assignedDriverId`  VARCHAR(191) NULL;
ALTER TABLE `vendor_direct_bookings` ADD COLUMN IF NOT EXISTS `assignedVehicleId` VARCHAR(191) NULL;
ALTER TABLE `vendor_direct_bookings` ADD COLUMN IF NOT EXISTS `assignedAt`        DATETIME(3)  NULL;

-- vendor_direct_bookings: other columns that may be missing on older manual tables
ALTER TABLE `vendor_direct_bookings` ADD COLUMN IF NOT EXISTS `bookingSource`  VARCHAR(191) NOT NULL DEFAULT 'manual';
ALTER TABLE `vendor_direct_bookings` ADD COLUMN IF NOT EXISTS `linkId`         VARCHAR(191) NULL;
ALTER TABLE `vendor_direct_bookings` ADD COLUMN IF NOT EXISTS `vehicleType`    VARCHAR(191) NULL;
ALTER TABLE `vendor_direct_bookings` ADD COLUMN IF NOT EXISTS `customerEmail`  VARCHAR(191) NULL;
ALTER TABLE `vendor_direct_bookings` ADD COLUMN IF NOT EXISTS `paymentMode`    VARCHAR(191) NULL;
ALTER TABLE `vendor_direct_bookings` ADD COLUMN IF NOT EXISTS `razorpayLinkId` VARCHAR(191) NULL;
ALTER TABLE `vendor_direct_bookings` ADD COLUMN IF NOT EXISTS `vendorNotes`    LONGTEXT     NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Indexes for assignment columns (CREATE INDEX IF NOT EXISTS — MySQL 8.0+)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS `vendor_direct_bookings_assignedDriverId_idx`  ON `vendor_direct_bookings`(`assignedDriverId`);
CREATE INDEX IF NOT EXISTS `vendor_direct_bookings_assignedVehicleId_idx` ON `vendor_direct_bookings`(`assignedVehicleId`);
CREATE INDEX IF NOT EXISTS `vendor_direct_bookings_bookingSource_idx`     ON `vendor_direct_bookings`(`bookingSource`);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Foreign key constraints
--    DROP IF EXISTS first so re-running this migration never errors.
-- ─────────────────────────────────────────────────────────────────────────────

-- vendor_booking_links → vendors
ALTER TABLE `vendor_booking_links`
    DROP FOREIGN KEY IF EXISTS `vendor_booking_links_vendorId_fkey`;
ALTER TABLE `vendor_booking_links`
    ADD CONSTRAINT `vendor_booking_links_vendorId_fkey`
    FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- vendor_direct_bookings → vendors
ALTER TABLE `vendor_direct_bookings`
    DROP FOREIGN KEY IF EXISTS `vendor_direct_bookings_vendorId_fkey`;
ALTER TABLE `vendor_direct_bookings`
    ADD CONSTRAINT `vendor_direct_bookings_vendorId_fkey`
    FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- vendor_direct_bookings → vendor_booking_links (nullable)
ALTER TABLE `vendor_direct_bookings`
    DROP FOREIGN KEY IF EXISTS `vendor_direct_bookings_linkId_fkey`;
ALTER TABLE `vendor_direct_bookings`
    ADD CONSTRAINT `vendor_direct_bookings_linkId_fkey`
    FOREIGN KEY (`linkId`) REFERENCES `vendor_booking_links`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- vendor_direct_bookings → vendor_staff (assigned driver, nullable)
ALTER TABLE `vendor_direct_bookings`
    DROP FOREIGN KEY IF EXISTS `vendor_direct_bookings_assignedDriverId_fkey`;
ALTER TABLE `vendor_direct_bookings`
    ADD CONSTRAINT `vendor_direct_bookings_assignedDriverId_fkey`
    FOREIGN KEY (`assignedDriverId`) REFERENCES `vendor_staff`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- vendor_direct_bookings → vendor_fleets (assigned vehicle, nullable)
ALTER TABLE `vendor_direct_bookings`
    DROP FOREIGN KEY IF EXISTS `vendor_direct_bookings_assignedVehicleId_fkey`;
ALTER TABLE `vendor_direct_bookings`
    ADD CONSTRAINT `vendor_direct_bookings_assignedVehicleId_fkey`
    FOREIGN KEY (`assignedVehicleId`) REFERENCES `vendor_fleets`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
