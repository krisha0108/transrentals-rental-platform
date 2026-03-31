-- Add acceptedDriverId field to chauffeur_bookings
-- Previously added via db push (no migration existed) - fixing for production

ALTER TABLE `chauffeur_bookings` ADD COLUMN `acceptedDriverId` VARCHAR(191) NULL;

-- Add index for acceptedDriverId
CREATE INDEX `chauffeur_bookings_acceptedDriverId_idx` ON `chauffeur_bookings`(`acceptedDriverId`);

-- Note: Foreign key constraint skipped intentionally
-- drivers table managed separately; referential integrity handled at app level
