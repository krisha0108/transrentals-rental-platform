-- Advance payment + quote metadata for travel-agent leads
ALTER TABLE `travel_agent_leads` ADD COLUMN `quoteAdvanceAmount` DOUBLE NULL;
ALTER TABLE `travel_agent_leads` ADD COLUMN `quoteAdvancePercent` INT NULL;
ALTER TABLE `travel_agent_leads` ADD COLUMN `quoteValidUntil` DATETIME(3) NULL;
ALTER TABLE `travel_agent_leads` ADD COLUMN `quoteTerms` TEXT NULL;
ALTER TABLE `travel_agent_leads` ADD COLUMN `quoteSentAt` DATETIME(3) NULL;
