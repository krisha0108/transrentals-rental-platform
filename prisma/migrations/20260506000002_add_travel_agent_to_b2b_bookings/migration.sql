-- Travel-agent flow: a TA booking lands in b2b_bookings with these fields set.
-- bookingMode = 'PERSONAL' (single vehicle) or 'COMPANY' (multi-vehicle, monthly).
-- For regular B2B customers both fields stay NULL.

ALTER TABLE `b2b_bookings`
  ADD COLUMN `travelAgentId` VARCHAR(191) NULL,
  ADD COLUMN `bookingMode`   VARCHAR(50)  NULL;

CREATE INDEX `b2b_bookings_travelAgentId_idx`
  ON `b2b_bookings`(`travelAgentId`);
