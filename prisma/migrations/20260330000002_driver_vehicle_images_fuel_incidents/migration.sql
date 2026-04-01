-- Add labeled photo fields to driver_vehicles
ALTER TABLE `driver_vehicles` ADD COLUMN `photoFront` VARCHAR(191) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN `photoBack` VARCHAR(191) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN `photoLeftSide` VARCHAR(191) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN `photoRightSide` VARCHAR(191) NULL;
ALTER TABLE `driver_vehicles` ADD COLUMN `photoInterior` VARCHAR(191) NULL;

-- Create driver_fuel_logs table
CREATE TABLE `driver_fuel_logs` (
  `id`            VARCHAR(191) NOT NULL,
  `vehicleId`     VARCHAR(191) NOT NULL,
  `date`          DATETIME(3) NOT NULL,
  `liters`        DOUBLE NOT NULL,
  `pricePerLiter` DOUBLE NULL,
  `totalAmount`   DOUBLE NOT NULL,
  `odometer`      INT NULL,
  `fuelStation`   VARCHAR(191) NULL,
  `fuelType`      VARCHAR(191) NULL,
  `notes`         TEXT NULL,
  `createdAt`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `driver_fuel_logs_vehicleId_idx` (`vehicleId`),
  CONSTRAINT `driver_fuel_logs_vehicleId_fkey`
    FOREIGN KEY (`vehicleId`) REFERENCES `driver_vehicles`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create driver_incidents table
CREATE TABLE `driver_incidents` (
  `id`           VARCHAR(191) NOT NULL,
  `vehicleId`    VARCHAR(191) NOT NULL,
  `date`         DATETIME(3) NOT NULL,
  `type`         VARCHAR(191) NOT NULL,
  `description`  TEXT NULL,
  `severity`     VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
  `repairCost`   DOUBLE NULL,
  `repairStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `photos`       LONGTEXT NULL,
  `notes`        TEXT NULL,
  `createdAt`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `driver_incidents_vehicleId_idx` (`vehicleId`),
  CONSTRAINT `driver_incidents_vehicleId_fkey`
    FOREIGN KEY (`vehicleId`) REFERENCES `driver_vehicles`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
