-- Migration: add_vendor_direct_bookings_and_booking_links
-- Creates vendor_booking_links and vendor_direct_bookings tables.
-- Safe to run on both fresh deployments and existing deployments
-- where these tables were created manually.
-- Compatible with MySQL 5.7+ (uses INFORMATION_SCHEMA checks instead of
-- ADD COLUMN IF NOT EXISTS which is MariaDB-only syntax).

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
--    Uses SET/PREPARE pattern (MySQL 5.7+ compatible) instead of
--    ADD COLUMN IF NOT EXISTS (MariaDB-only).
-- ─────────────────────────────────────────────────────────────────────────────

-- vendor_booking_links: formTitle
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `vendor_booking_links` ADD COLUMN `formTitle` VARCHAR(191) NULL', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_booking_links' AND COLUMN_NAME = 'formTitle');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

-- vendor_booking_links: welcomeMsg
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `vendor_booking_links` ADD COLUMN `welcomeMsg` LONGTEXT NULL', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_booking_links' AND COLUMN_NAME = 'welcomeMsg');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

-- vendor_booking_links: visibleFields
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `vendor_booking_links` ADD COLUMN `visibleFields` JSON NULL', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_booking_links' AND COLUMN_NAME = 'visibleFields');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

-- vendor_booking_links: requireAdvance
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `vendor_booking_links` ADD COLUMN `requireAdvance` BOOLEAN NOT NULL DEFAULT false', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_booking_links' AND COLUMN_NAME = 'requireAdvance');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

-- vendor_booking_links: advanceAmount
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `vendor_booking_links` ADD COLUMN `advanceAmount` DOUBLE NULL', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_booking_links' AND COLUMN_NAME = 'advanceAmount');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

-- vendor_booking_links: clickCount
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `vendor_booking_links` ADD COLUMN `clickCount` INTEGER NOT NULL DEFAULT 0', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_booking_links' AND COLUMN_NAME = 'clickCount');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

-- vendor_booking_links: bookingCount
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `vendor_booking_links` ADD COLUMN `bookingCount` INTEGER NOT NULL DEFAULT 0', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_booking_links' AND COLUMN_NAME = 'bookingCount');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

-- vendor_direct_bookings: assignedDriverId
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `vendor_direct_bookings` ADD COLUMN `assignedDriverId` VARCHAR(191) NULL', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_direct_bookings' AND COLUMN_NAME = 'assignedDriverId');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

-- vendor_direct_bookings: assignedVehicleId
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `vendor_direct_bookings` ADD COLUMN `assignedVehicleId` VARCHAR(191) NULL', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_direct_bookings' AND COLUMN_NAME = 'assignedVehicleId');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

-- vendor_direct_bookings: assignedAt
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `vendor_direct_bookings` ADD COLUMN `assignedAt` DATETIME(3) NULL', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_direct_bookings' AND COLUMN_NAME = 'assignedAt');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

-- vendor_direct_bookings: bookingSource
SET @sql = (SELECT IF(COUNT(*) = 0, "ALTER TABLE `vendor_direct_bookings` ADD COLUMN `bookingSource` VARCHAR(191) NOT NULL DEFAULT 'manual'", 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_direct_bookings' AND COLUMN_NAME = 'bookingSource');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

-- vendor_direct_bookings: linkId
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `vendor_direct_bookings` ADD COLUMN `linkId` VARCHAR(191) NULL', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_direct_bookings' AND COLUMN_NAME = 'linkId');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

-- vendor_direct_bookings: vehicleType
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `vendor_direct_bookings` ADD COLUMN `vehicleType` VARCHAR(191) NULL', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_direct_bookings' AND COLUMN_NAME = 'vehicleType');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

-- vendor_direct_bookings: customerEmail
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `vendor_direct_bookings` ADD COLUMN `customerEmail` VARCHAR(191) NULL', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_direct_bookings' AND COLUMN_NAME = 'customerEmail');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

-- vendor_direct_bookings: paymentMode
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `vendor_direct_bookings` ADD COLUMN `paymentMode` VARCHAR(191) NULL', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_direct_bookings' AND COLUMN_NAME = 'paymentMode');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

-- vendor_direct_bookings: razorpayLinkId
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `vendor_direct_bookings` ADD COLUMN `razorpayLinkId` VARCHAR(191) NULL', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_direct_bookings' AND COLUMN_NAME = 'razorpayLinkId');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

-- vendor_direct_bookings: vendorNotes
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `vendor_direct_bookings` ADD COLUMN `vendorNotes` LONGTEXT NULL', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_direct_bookings' AND COLUMN_NAME = 'vendorNotes');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Indexes for assignment columns
-- ─────────────────────────────────────────────────────────────────────────────

SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `vendor_direct_bookings_assignedDriverId_idx` ON `vendor_direct_bookings`(`assignedDriverId`)', 'SELECT 1') FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_direct_bookings' AND INDEX_NAME = 'vendor_direct_bookings_assignedDriverId_idx');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `vendor_direct_bookings_assignedVehicleId_idx` ON `vendor_direct_bookings`(`assignedVehicleId`)', 'SELECT 1') FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_direct_bookings' AND INDEX_NAME = 'vendor_direct_bookings_assignedVehicleId_idx');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `vendor_direct_bookings_bookingSource_idx` ON `vendor_direct_bookings`(`bookingSource`)', 'SELECT 1') FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_direct_bookings' AND INDEX_NAME = 'vendor_direct_bookings_bookingSource_idx');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Foreign key constraints
--    Drop if exists (via INFORMATION_SCHEMA check) then re-add.
-- ─────────────────────────────────────────────────────────────────────────────

-- vendor_booking_links → vendors
SET @sql = (SELECT IF(COUNT(*) > 0, 'ALTER TABLE `vendor_booking_links` DROP FOREIGN KEY `vendor_booking_links_vendorId_fkey`', 'SELECT 1') FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_booking_links' AND CONSTRAINT_NAME = 'vendor_booking_links_vendorId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;
ALTER TABLE `vendor_booking_links`
    ADD CONSTRAINT `vendor_booking_links_vendorId_fkey`
    FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- vendor_direct_bookings → vendors
SET @sql = (SELECT IF(COUNT(*) > 0, 'ALTER TABLE `vendor_direct_bookings` DROP FOREIGN KEY `vendor_direct_bookings_vendorId_fkey`', 'SELECT 1') FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_direct_bookings' AND CONSTRAINT_NAME = 'vendor_direct_bookings_vendorId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;
ALTER TABLE `vendor_direct_bookings`
    ADD CONSTRAINT `vendor_direct_bookings_vendorId_fkey`
    FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- vendor_direct_bookings → vendor_booking_links (nullable)
SET @sql = (SELECT IF(COUNT(*) > 0, 'ALTER TABLE `vendor_direct_bookings` DROP FOREIGN KEY `vendor_direct_bookings_linkId_fkey`', 'SELECT 1') FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_direct_bookings' AND CONSTRAINT_NAME = 'vendor_direct_bookings_linkId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;
ALTER TABLE `vendor_direct_bookings`
    ADD CONSTRAINT `vendor_direct_bookings_linkId_fkey`
    FOREIGN KEY (`linkId`) REFERENCES `vendor_booking_links`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- vendor_direct_bookings → vendor_staff (assigned driver, nullable)
SET @sql = (SELECT IF(COUNT(*) > 0, 'ALTER TABLE `vendor_direct_bookings` DROP FOREIGN KEY `vendor_direct_bookings_assignedDriverId_fkey`', 'SELECT 1') FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_direct_bookings' AND CONSTRAINT_NAME = 'vendor_direct_bookings_assignedDriverId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;
ALTER TABLE `vendor_direct_bookings`
    ADD CONSTRAINT `vendor_direct_bookings_assignedDriverId_fkey`
    FOREIGN KEY (`assignedDriverId`) REFERENCES `vendor_staff`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- vendor_direct_bookings → vendor_fleets (assigned vehicle, nullable)
SET @sql = (SELECT IF(COUNT(*) > 0, 'ALTER TABLE `vendor_direct_bookings` DROP FOREIGN KEY `vendor_direct_bookings_assignedVehicleId_fkey`', 'SELECT 1') FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_direct_bookings' AND CONSTRAINT_NAME = 'vendor_direct_bookings_assignedVehicleId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
PREPARE _s FROM @sql;
EXECUTE _s;
DEALLOCATE PREPARE _s;
ALTER TABLE `vendor_direct_bookings`
    ADD CONSTRAINT `vendor_direct_bookings_assignedVehicleId_fkey`
    FOREIGN KEY (`assignedVehicleId`) REFERENCES `vendor_fleets`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;


ALTER TABLE `vendors` ADD COLUMN `slug` VARCHAR(191) NULL UNIQUE;
