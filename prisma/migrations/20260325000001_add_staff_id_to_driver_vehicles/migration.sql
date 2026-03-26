-- Allow vendor_staff to have personal vehicles in driver_vehicles table
-- Make driverId nullable (was required before)
ALTER TABLE `driver_vehicles` MODIFY COLUMN `driverId` VARCHAR(191) NULL;

-- Add staffId column referencing vendor_staff
ALTER TABLE `driver_vehicles` ADD COLUMN `staffId` VARCHAR(191) NULL;

-- Add index on staffId
CREATE INDEX `driver_vehicles_staffId_idx` ON `driver_vehicles`(`staffId`);

-- Add foreign key constraint
ALTER TABLE `driver_vehicles` ADD CONSTRAINT `driver_vehicles_staffId_fkey`
  FOREIGN KEY (`staffId`) REFERENCES `vendor_staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
