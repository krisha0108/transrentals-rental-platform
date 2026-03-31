-- Create driver_maintenance_logs table (previously added via db push without migration)
CREATE TABLE IF NOT EXISTS `driver_maintenance_logs` (
  `id` VARCHAR(191) NOT NULL,
  `vehicleId` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `cost` DOUBLE NOT NULL DEFAULT 0,
  `date` DATETIME(3) NOT NULL,
  `odometer` INTEGER NULL,
  `nextDueDate` DATETIME(3) NULL,
  `document` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `driver_maintenance_logs_vehicleId_idx` (`vehicleId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key to driver_vehicles
ALTER TABLE `driver_maintenance_logs`
  ADD CONSTRAINT `driver_maintenance_logs_vehicleId_fkey`
  FOREIGN KEY (`vehicleId`) REFERENCES `driver_vehicles`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
