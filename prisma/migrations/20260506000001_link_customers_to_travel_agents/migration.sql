-- Link a customer record to a travel_agents row when the same person operates
-- as both — used for the "travel agent self-booking" flow.

ALTER TABLE `customers`
  ADD COLUMN `linkedTravelAgentId` VARCHAR(191) NULL;

CREATE INDEX `customers_linkedTravelAgentId_idx`
  ON `customers`(`linkedTravelAgentId`);
