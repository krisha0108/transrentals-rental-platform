-- Add intermediateStops column to chauffeur_bookings
-- Stores JSON array of intermediate stops for multi-stop outstation trips

ALTER TABLE `chauffeur_bookings`
  ADD COLUMN `intermediateStops` LONGTEXT NULL
  AFTER `dropCity`;
