-- AlterTable
ALTER TABLE `packers_quotes` ADD COLUMN `vehicleImages` LONGTEXT NULL,
    ADD COLUMN `vendorFleetId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `truck_quotes` ADD COLUMN `vehicleImages` LONGTEXT NULL,
    ADD COLUMN `vendorFleetId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `packers_quotes_vendorFleetId_idx` ON `packers_quotes`(`vendorFleetId`);

-- CreateIndex
CREATE INDEX `truck_quotes_vendorFleetId_idx` ON `truck_quotes`(`vendorFleetId`);

-- AddForeignKey
ALTER TABLE `packers_quotes` ADD CONSTRAINT `packers_quotes_vendorFleetId_fkey` FOREIGN KEY (`vendorFleetId`) REFERENCES `vendor_fleets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `truck_quotes` ADD CONSTRAINT `truck_quotes_vendorFleetId_fkey` FOREIGN KEY (`vendorFleetId`) REFERENCES `vendor_fleets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
