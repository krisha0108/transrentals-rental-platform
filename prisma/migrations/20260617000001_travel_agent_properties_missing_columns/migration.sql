-- AlterTable: add missing columns to travel_agent_properties
ALTER TABLE `travel_agent_properties`
  ADD COLUMN IF NOT EXISTS `bedroomsCount` INTEGER NULL AFTER `totalRooms`,
  ADD COLUMN IF NOT EXISTS `bathroomsCount` INTEGER NULL AFTER `bedroomsCount`,
  ADD COLUMN IF NOT EXISTS `maxGuests` INTEGER NULL AFTER `bathroomsCount`,
  ADD COLUMN IF NOT EXISTS `minNights` INTEGER NULL DEFAULT 1 AFTER `startingPrice`,
  ADD COLUMN IF NOT EXISTS `maxNights` INTEGER NULL AFTER `minNights`,
  ADD COLUMN IF NOT EXISTS `cancellationPolicy` VARCHAR(191) NULL AFTER `maxNights`,
  ADD COLUMN IF NOT EXISTS `landmark` VARCHAR(191) NULL AFTER `cancellationPolicy`,
  ADD COLUMN IF NOT EXISTS `highlights` TEXT NULL AFTER `landmark`;
