-- Cities a driver picked at registration (a driver can pick more than one).
-- drivers.city/state stay as-is for simple display; this table is the real
-- source of truth used to find and notify the managers scoped to those cities.
CREATE TABLE `driver_locations` (
    `id` VARCHAR(191) NOT NULL,
    `driverId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `driver_locations_locationId_idx`(`locationId`),
    UNIQUE INDEX `driver_locations_driverId_locationId_key`(`driverId`, `locationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `driver_locations` ADD CONSTRAINT `driver_locations_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `driver_locations` ADD CONSTRAINT `driver_locations_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
