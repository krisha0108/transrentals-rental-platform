-- Customer accept + advance-payment proof for travel-agent leads
ALTER TABLE `travel_agent_leads` ADD COLUMN `customerAcceptedAt` DATETIME(3) NULL;
ALTER TABLE `travel_agent_leads` ADD COLUMN `paymentStatus` VARCHAR(32) NULL;
ALTER TABLE `travel_agent_leads` ADD COLUMN `paymentTxnId` VARCHAR(191) NULL;
ALTER TABLE `travel_agent_leads` ADD COLUMN `paymentProofImages` TEXT NULL;
ALTER TABLE `travel_agent_leads` ADD COLUMN `paymentNote` TEXT NULL;
ALTER TABLE `travel_agent_leads` ADD COLUMN `paymentSubmittedAt` DATETIME(3) NULL;
ALTER TABLE `travel_agent_leads` ADD COLUMN `paymentVerifiedAt` DATETIME(3) NULL;
ALTER TABLE `travel_agent_leads` ADD COLUMN `paymentRejectReason` TEXT NULL;
