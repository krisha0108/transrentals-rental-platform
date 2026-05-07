-- Add numberOfVehicles column to self_drive_quote_requests so the customer can
-- request multiple cars in a single self-drive quote request.

ALTER TABLE `self_drive_quote_requests`
  ADD COLUMN `numberOfVehicles` INT NOT NULL DEFAULT 1;
