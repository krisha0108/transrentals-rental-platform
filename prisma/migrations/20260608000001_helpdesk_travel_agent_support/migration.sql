-- Travel Agent support tickets
-- Adds travelAgentId and submitterType to helpdesk_tickets so travel agents
-- can raise tickets that are attributed to them (not customers) and the admin
-- helpdesk panel can distinguish the submitter type.

ALTER TABLE `helpdesk_tickets`
  ADD COLUMN `travelAgentId` VARCHAR(191) NULL AFTER `customerId`,
  ADD COLUMN `submitterType` VARCHAR(50) NULL DEFAULT 'customer' AFTER `travelAgentId`;

-- FK index for travel agent tickets
CREATE INDEX `helpdesk_tickets_travelAgentId_idx` ON `helpdesk_tickets` (`travelAgentId`);
