-- Add all missing fields to driver_vehicles table
-- These fields exist in Prisma schema but were never added via migration

-- Core vehicle info
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `make`             VARCHAR(191) NOT NULL DEFAULT 'Unknown';
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `model`            VARCHAR(191) NOT NULL DEFAULT 'Unknown';
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `year`             INTEGER NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `registrationNo`   VARCHAR(191) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `color`            VARCHAR(191) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `category`         VARCHAR(191) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `seatingCapacity`  INTEGER NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `fuelType`         VARCHAR(191) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `isActive`         BOOLEAN NOT NULL DEFAULT true;

-- Insurance
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `insuranceNumber`   VARCHAR(191) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `insuranceExpiry`   DATETIME(3) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `insuranceDocument` VARCHAR(191) NULL;

-- RC (Registration Certificate)
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `rcNumber`   VARCHAR(191) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `rcExpiry`   DATETIME(3) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `rcDocument` VARCHAR(191) NULL;

-- Fitness
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `fitnessExpiry`   DATETIME(3) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `fitnessDocument` VARCHAR(191) NULL;

-- Permit
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `permitExpiry`   DATETIME(3) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `permitDocument` VARCHAR(191) NULL;

-- Photos JSON array
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `vehiclePhotos` LONGTEXT NULL;

-- Service tracking
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `lastServiceDate`  DATETIME(3) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `nextServiceDate`  DATETIME(3) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN IF NOT EXISTS `currentOdometer`  INTEGER NULL;

-- Add driverId index if not already present
CREATE INDEX IF NOT EXISTS `driver_vehicles_driverId_idx` ON `driver_vehicles`(`driverId`);
