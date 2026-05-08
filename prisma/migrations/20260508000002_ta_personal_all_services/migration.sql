-- Track travel-agent PERSONAL bookings explicitly across all remaining
-- service tables. COMPANY bookings continue to live in b2b_bookings (which
-- already has travelAgentId + bookingMode columns).
--
-- All columns are nullable so existing rows remain valid; PERSONAL bookings
-- get bookingMode='PERSONAL' + travelAgentId=<agentId> set.

-- bike_bookings
ALTER TABLE `bike_bookings`
  ADD COLUMN `travelAgentId` VARCHAR(191) NULL,
  ADD COLUMN `bookingMode`   VARCHAR(20)  NULL;
CREATE INDEX `bike_bookings_travelAgentId_idx`
  ON `bike_bookings`(`travelAgentId`);

-- bike_quote_requests
ALTER TABLE `bike_quote_requests`
  ADD COLUMN `travelAgentId` VARCHAR(191) NULL,
  ADD COLUMN `bookingMode`   VARCHAR(20)  NULL;
CREATE INDEX `bike_quote_requests_travelAgentId_idx`
  ON `bike_quote_requests`(`travelAgentId`);

-- car_bookings (chat hero's car flow)
ALTER TABLE `car_bookings`
  ADD COLUMN `travelAgentId` VARCHAR(191) NULL,
  ADD COLUMN `bookingMode`   VARCHAR(20)  NULL;
CREATE INDEX `car_bookings_travelAgentId_idx`
  ON `car_bookings`(`travelAgentId`);

-- truck_quote_requests
ALTER TABLE `truck_quote_requests`
  ADD COLUMN `travelAgentId` VARCHAR(191) NULL,
  ADD COLUMN `bookingMode`   VARCHAR(20)  NULL;
CREATE INDEX `truck_quote_requests_travelAgentId_idx`
  ON `truck_quote_requests`(`travelAgentId`);

-- packers_quote_requests
ALTER TABLE `packers_quote_requests`
  ADD COLUMN `travelAgentId` VARCHAR(191) NULL,
  ADD COLUMN `bookingMode`   VARCHAR(20)  NULL;
CREATE INDEX `packers_quote_requests_travelAgentId_idx`
  ON `packers_quote_requests`(`travelAgentId`);

-- equipment_quote_requests
ALTER TABLE `equipment_quote_requests`
  ADD COLUMN `travelAgentId` VARCHAR(191) NULL,
  ADD COLUMN `bookingMode`   VARCHAR(20)  NULL;
CREATE INDEX `equipment_quote_requests_travelAgentId_idx`
  ON `equipment_quote_requests`(`travelAgentId`);

-- luxury_bookings
ALTER TABLE `luxury_bookings`
  ADD COLUMN `travelAgentId` VARCHAR(191) NULL,
  ADD COLUMN `bookingMode`   VARCHAR(20)  NULL;
CREATE INDEX `luxury_bookings_travelAgentId_idx`
  ON `luxury_bookings`(`travelAgentId`);

-- luxury_quote_requests
ALTER TABLE `luxury_quote_requests`
  ADD COLUMN `travelAgentId` VARCHAR(191) NULL,
  ADD COLUMN `bookingMode`   VARCHAR(20)  NULL;
CREATE INDEX `luxury_quote_requests_travelAgentId_idx`
  ON `luxury_quote_requests`(`travelAgentId`);

-- self_drive_quote_requests
ALTER TABLE `self_drive_quote_requests`
  ADD COLUMN `travelAgentId` VARCHAR(191) NULL,
  ADD COLUMN `bookingMode`   VARCHAR(20)  NULL;
CREATE INDEX `self_drive_quote_requests_travelAgentId_idx`
  ON `self_drive_quote_requests`(`travelAgentId`);
