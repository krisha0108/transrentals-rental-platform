-- Add optional customerId column to travel_agent_leads so the customer dashboard
-- can reliably match leads to a logged-in customer (without depending solely on
-- phone-string equality).

ALTER TABLE `travel_agent_leads`
  ADD COLUMN `customerId` VARCHAR(191) NULL AFTER `tourId`,
  ADD INDEX `travel_agent_leads_customerId_idx`(`customerId`);
