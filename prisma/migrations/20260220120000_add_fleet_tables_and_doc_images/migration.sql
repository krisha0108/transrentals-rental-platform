-- CreateTable: fleet_maintenance_records
CREATE TABLE IF NOT EXISTS `fleet_maintenance_records` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `vendorFleetId` VARCHAR(191) NOT NULL,
    `serviceType` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `serviceDate` DATE NOT NULL,
    `odometerReading` INTEGER NULL,
    `cost` DOUBLE NOT NULL DEFAULT 0,
    `serviceProvider` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fleet_maintenance_records_vendorId_idx`(`vendorId`),
    INDEX `fleet_maintenance_records_vendorFleetId_idx`(`vendorFleetId`),
    INDEX `fleet_maintenance_records_serviceDate_idx`(`serviceDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: fleet_incidents
CREATE TABLE IF NOT EXISTS `fleet_incidents` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `vendorFleetId` VARCHAR(191) NOT NULL,
    `incidentDate` DATE NOT NULL,
    `incidentType` VARCHAR(191) NOT NULL,
    `severity` VARCHAR(191) NOT NULL DEFAULT 'MINOR',
    `location` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `estimatedCost` DOUBLE NULL,
    `insuranceClaimed` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `resolution` TEXT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fleet_incidents_vendorId_idx`(`vendorId`),
    INDEX `fleet_incidents_vendorFleetId_idx`(`vendorFleetId`),
    INDEX `fleet_incidents_incidentDate_idx`(`incidentDate`),
    INDEX `fleet_incidents_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: fleet_fuel_records
CREATE TABLE IF NOT EXISTS `fleet_fuel_records` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `vendorFleetId` VARCHAR(191) NOT NULL,
    `fuelDate` DATE NOT NULL,
    `fuelType` VARCHAR(191) NULL,
    `quantity` DOUBLE NOT NULL,
    `pricePerUnit` DOUBLE NOT NULL,
    `totalCost` DOUBLE NOT NULL,
    `odometerReading` INTEGER NULL,
    `fuelStation` VARCHAR(191) NULL,
    `paymentMode` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fleet_fuel_records_vendorId_idx`(`vendorId`),
    INDEX `fleet_fuel_records_vendorFleetId_idx`(`vendorFleetId`),
    INDEX `fleet_fuel_records_fuelDate_idx`(`fuelDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddColumn: document image fields on vendor_fleets (safe)
ALTER TABLE `vendor_fleets` ADD COLUMN IF NOT EXISTS `insuranceImage` VARCHAR(191) NULL;
ALTER TABLE `vendor_fleets` ADD COLUMN IF NOT EXISTS `fitnessImage` VARCHAR(191) NULL;
ALTER TABLE `vendor_fleets` ADD COLUMN IF NOT EXISTS `permitImage` VARCHAR(191) NULL;
ALTER TABLE `vendor_fleets` ADD COLUMN IF NOT EXISTS `rcImage` VARCHAR(191) NULL;

-- AddForeignKey: fleet_maintenance_records -> vendors
ALTER TABLE `fleet_maintenance_records` DROP FOREIGN KEY IF EXISTS `fleet_maintenance_records_vendorId_fkey`;
ALTER TABLE `fleet_maintenance_records` ADD CONSTRAINT `fleet_maintenance_records_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: fleet_maintenance_records -> vendor_fleets
ALTER TABLE `fleet_maintenance_records` DROP FOREIGN KEY IF EXISTS `fleet_maintenance_records_vendorFleetId_fkey`;
ALTER TABLE `fleet_maintenance_records` ADD CONSTRAINT `fleet_maintenance_records_vendorFleetId_fkey` FOREIGN KEY (`vendorFleetId`) REFERENCES `vendor_fleets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: fleet_incidents -> vendors
ALTER TABLE `fleet_incidents` DROP FOREIGN KEY IF EXISTS `fleet_incidents_vendorId_fkey`;
ALTER TABLE `fleet_incidents` ADD CONSTRAINT `fleet_incidents_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: fleet_incidents -> vendor_fleets
ALTER TABLE `fleet_incidents` DROP FOREIGN KEY IF EXISTS `fleet_incidents_vendorFleetId_fkey`;
ALTER TABLE `fleet_incidents` ADD CONSTRAINT `fleet_incidents_vendorFleetId_fkey` FOREIGN KEY (`vendorFleetId`) REFERENCES `vendor_fleets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: fleet_fuel_records -> vendors
ALTER TABLE `fleet_fuel_records` DROP FOREIGN KEY IF EXISTS `fleet_fuel_records_vendorId_fkey`;
ALTER TABLE `fleet_fuel_records` ADD CONSTRAINT `fleet_fuel_records_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: fleet_fuel_records -> vendor_fleets
ALTER TABLE `fleet_fuel_records` DROP FOREIGN KEY IF EXISTS `fleet_fuel_records_vendorFleetId_fkey`;
ALTER TABLE `fleet_fuel_records` ADD CONSTRAINT `fleet_fuel_records_vendorFleetId_fkey` FOREIGN KEY (`vendorFleetId`) REFERENCES `vendor_fleets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
