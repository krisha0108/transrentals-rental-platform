-- AlterTable
ALTER TABLE `chauffeur_bookings` ADD COLUMN `acceptedStaffId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `chauffeur_bookings_acceptedStaffId_idx` ON `chauffeur_bookings`(`acceptedStaffId`);
