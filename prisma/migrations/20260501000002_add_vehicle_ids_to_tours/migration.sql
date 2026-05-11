-- Add vehicleIds column to travel_agent_tours
-- Stores a JSON array of travel_agent_fleets IDs attached to each tour
-- so customers can see which vehicle(s) will be used.

ALTER TABLE `travel_agent_tours`
  ADD COLUMN `vehicleIds` LONGTEXT NULL AFTER `galleryImages`;
