-- Add cancellationNotes column to wander_listings
ALTER TABLE `wander_listings` ADD COLUMN `cancellationNotes` TEXT NULL AFTER `cancellationPolicy`;
