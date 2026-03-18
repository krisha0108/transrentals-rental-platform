-- Add shortDescription column to wander_listings
ALTER TABLE `wander_listings` ADD COLUMN `shortDescription` VARCHAR(191) NULL AFTER `title`;
