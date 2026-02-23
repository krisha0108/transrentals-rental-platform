-- CreateTable
CREATE TABLE IF NOT EXISTS `vendor_fleet_blocked_dates` (
    `id` VARCHAR(191) NOT NULL,
    `vendorFleetId` VARCHAR(191) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `reason` VARCHAR(191) NOT NULL DEFAULT 'BOOKING',
    `bookingId` VARCHAR(191) NULL,
    `bookingType` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdBy` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `vendor_fleet_blocked_dates_vendorFleetId_idx`(`vendorFleetId`),
    INDEX `vendor_fleet_blocked_dates_startDate_idx`(`startDate`),
    INDEX `vendor_fleet_blocked_dates_endDate_idx`(`endDate`),
    INDEX `vendor_fleet_blocked_dates_bookingId_idx`(`bookingId`),
    INDEX `vendor_fleet_blocked_dates_vendorFleetId_startDate_endDate_idx`(`vendorFleetId`, `startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vendor_fleet_blocked_dates` ADD CONSTRAINT `vendor_fleet_blocked_dates_vendorFleetId_fkey` FOREIGN KEY (`vendorFleetId`) REFERENCES `vendor_fleets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
