-- Add numberOfVehicles column to bike_quote_requests so the customer can
-- request multiple bikes in a single quote request.

ALTER TABLE `bike_quote_requests`
  ADD COLUMN `numberOfVehicles` INT NOT NULL DEFAULT 1;
