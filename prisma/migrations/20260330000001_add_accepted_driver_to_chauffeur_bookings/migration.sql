-- Add acceptedDriverId field to chauffeur_bookings
-- Previously added via db push (no migration existed) - fixing for production

ALTER TABLE `chauffeur_bookings` ADD COLUMN `acceptedDriverId` VARCHAR(191) NULL;

-- Add index for acceptedDriverId
CREATE INDEX `chauffeur_bookings_acceptedDriverId_idx` ON `chauffeur_bookings`(`acceptedDriverId`);

-- Add foreign key constraint
ALTER TABLE `chauffeur_bookings`
  ADD CONSTRAINT `chauffeur_bookings_acceptedDriverId_fkey`
  FOREIGN KEY (`acceptedDriverId`) REFERENCES `drivers`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
