-- Add priceTiers column to wander_listings
ALTER TABLE `wander_listings` ADD COLUMN `priceTiers` LONGTEXT NULL AFTER `itinerary`;
