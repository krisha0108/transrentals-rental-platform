-- Allow vendor_staff to have personal vehicles in driver_vehicles table
-- Create driver_vehicles table if it doesn't exist
CREATE TABLE IF NOT EXISTS `driver_vehicles` (
  `id` VARCHAR(191) NOT NULL,
  `driverId` VARCHAR(191) NULL,
  `vehicleId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Make driverId nullable (was required before)
ALTER TABLE `driver_vehicles` MODIFY COLUMN `driverId` VARCHAR(191) NULL;

-- Add staffId column referencing vendor_staff
ALTER TABLE `driver_vehicles` ADD COLUMN `staffId` VARCHAR(191) NULL;

-- Add index on staffId
CREATE INDEX `driver_vehicles_staffId_idx` ON `driver_vehicles`(`staffId`);

-- Add foreign key constraint
ALTER TABLE `driver_vehicles` ADD CONSTRAINT `driver_vehicles_staffId_fkey`
  FOREIGN KEY (`staffId`) REFERENCES `vendor_staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
