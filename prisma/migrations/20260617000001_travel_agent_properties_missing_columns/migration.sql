-- AlterTable: add missing columns to travel_agent_properties
ALTER TABLE `travel_agent_properties`
  ADD COLUMN `bedroomsCount` INTEGER NULL AFTER `totalRooms`,
  ADD COLUMN `bathroomsCount` INTEGER NULL AFTER `bedroomsCount`,
  ADD COLUMN `maxGuests` INTEGER NULL AFTER `bathroomsCount`,
  ADD COLUMN `minNights` INTEGER NULL DEFAULT 1 AFTER `startingPrice`,
  ADD COLUMN `maxNights` INTEGER NULL AFTER `minNights`,
  ADD COLUMN `cancellationPolicy` VARCHAR(191) NULL AFTER `maxNights`,
  ADD COLUMN `landmark` VARCHAR(191) NULL AFTER `cancellationPolicy`,
  ADD COLUMN `highlights` TEXT NULL AFTER `landmark`;
