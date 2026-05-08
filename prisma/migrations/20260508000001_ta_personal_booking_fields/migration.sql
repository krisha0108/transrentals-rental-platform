-- Track travel-agent PERSONAL bookings explicitly on the regular customer
-- booking tables. COMPANY bookings continue to live in b2b_bookings (which
-- already has travelAgentId + bookingMode columns).
--
-- Both columns are nullable so existing rows remain valid; PERSONAL bookings
-- get bookingMode='PERSONAL' + travelAgentId=<agentId> set.

ALTER TABLE `chauffeur_bookings`
  ADD COLUMN `travelAgentId` VARCHAR(191) NULL,
  ADD COLUMN `bookingMode`   VARCHAR(20)  NULL;

CREATE INDEX `chauffeur_bookings_travelAgentId_idx`
  ON `chauffeur_bookings`(`travelAgentId`);

ALTER TABLE `bus_quote_requests`
  ADD COLUMN `travelAgentId` VARCHAR(191) NULL,
  ADD COLUMN `bookingMode`   VARCHAR(20)  NULL;

CREATE INDEX `bus_quote_requests_travelAgentId_idx`
  ON `bus_quote_requests`(`travelAgentId`);
