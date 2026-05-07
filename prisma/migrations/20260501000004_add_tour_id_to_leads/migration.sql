-- Add optional tourId column to travel_agent_leads so quote-request flow can link
-- the lead back to the originating travel_agent_tours row (for joining tour info
-- on the customer's wander-quotes dashboard).

ALTER TABLE `travel_agent_leads`
  ADD COLUMN `tourId` VARCHAR(191) NULL AFTER `convertedBookingId`,
  ADD INDEX `travel_agent_leads_tourId_idx`(`tourId`);
