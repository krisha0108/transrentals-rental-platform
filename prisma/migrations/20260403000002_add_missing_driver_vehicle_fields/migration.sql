-- Add all missing fields to driver_vehicles table
-- These fields exist in Prisma schema but were never added via migration
-- NOTE: IF NOT EXISTS is NOT supported in MySQL for ADD COLUMN — removed

-- Core vehicle info
ALTER TABLE `driver_vehicles`
  ADD COLUMN `make`            VARCHAR(191) NOT NULL DEFAULT 'Unknown',
  ADD COLUMN `model`           VARCHAR(191) NOT NULL DEFAULT 'Unknown',
  ADD COLUMN `year`            INTEGER NULL,
  ADD COLUMN `registrationNo`  VARCHAR(191) NULL,
  ADD COLUMN `color`           VARCHAR(191) NULL,
  ADD COLUMN `category`        VARCHAR(191) NULL,
  ADD COLUMN `seatingCapacity` INTEGER NULL,
  ADD COLUMN `fuelType`        VARCHAR(191) NULL,
  ADD COLUMN `isActive`        BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `insuranceNumber`   VARCHAR(191) NULL,
  ADD COLUMN `insuranceExpiry`   DATETIME(3) NULL,
  ADD COLUMN `insuranceDocument` VARCHAR(191) NULL,
  ADD COLUMN `rcNumber`          VARCHAR(191) NULL,
  ADD COLUMN `rcExpiry`          DATETIME(3) NULL,
  ADD COLUMN `rcDocument`        VARCHAR(191) NULL,
  ADD COLUMN `fitnessExpiry`     DATETIME(3) NULL,
  ADD COLUMN `fitnessDocument`   VARCHAR(191) NULL,
  ADD COLUMN `permitExpiry`      DATETIME(3) NULL,
  ADD COLUMN `permitDocument`    VARCHAR(191) NULL,
  ADD COLUMN `vehiclePhotos`     LONGTEXT NULL,
  ADD COLUMN `lastServiceDate`   DATETIME(3) NULL,
  ADD COLUMN `nextServiceDate`   DATETIME(3) NULL,
  ADD COLUMN `currentOdometer`   INTEGER NULL;

-- Indexes already exist from initial table creation, skipped
