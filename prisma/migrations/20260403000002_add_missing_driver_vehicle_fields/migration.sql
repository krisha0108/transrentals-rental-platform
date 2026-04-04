-- Add all missing fields to driver_vehicles table
-- These fields exist in Prisma schema but were never added via migration

-- Core vehicle info
ALTER TABLE `driver_vehicles` ADD COLUMN `make`             VARCHAR(191) NOT NULL DEFAULT 'Unknown';
ALTER TABLE `driver_vehicles` ADD COLUMN `model`            VARCHAR(191) NOT NULL DEFAULT 'Unknown';
ALTER TABLE `driver_vehicles` ADD COLUMN `year`             INTEGER NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN `registrationNo`   VARCHAR(191) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN `color`            VARCHAR(191) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN `category`         VARCHAR(191) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN `seatingCapacity`  INTEGER NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN `fuelType`         VARCHAR(191) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN `isActive`         BOOLEAN NOT NULL DEFAULT true;

-- Insurance
ALTER TABLE `driver_vehicles` ADD COLUMN `insuranceNumber`   VARCHAR(191) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN `insuranceExpiry`   DATETIME(3) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN `insuranceDocument` VARCHAR(191) NULL;

-- RC (Registration Certificate)
ALTER TABLE `driver_vehicles` ADD COLUMN `rcNumber`   VARCHAR(191) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN `rcExpiry`   DATETIME(3) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN `rcDocument` VARCHAR(191) NULL;

-- Fitness
ALTER TABLE `driver_vehicles` ADD COLUMN `fitnessExpiry`   DATETIME(3) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN `fitnessDocument` VARCHAR(191) NULL;

-- Permit
ALTER TABLE `driver_vehicles` ADD COLUMN `permitExpiry`   DATETIME(3) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN `permitDocument` VARCHAR(191) NULL;

-- Photos JSON array
ALTER TABLE `driver_vehicles` ADD COLUMN `vehiclePhotos` LONGTEXT NULL;

-- Service tracking
ALTER TABLE `driver_vehicles` ADD COLUMN `lastServiceDate`  DATETIME(3) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN `nextServiceDate`  DATETIME(3) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN `currentOdometer`  INTEGER NULL;

-- Add driverId index
CREATE INDEX `driver_vehicles_driverId_idx` ON `driver_vehicles`(`driverId`);
