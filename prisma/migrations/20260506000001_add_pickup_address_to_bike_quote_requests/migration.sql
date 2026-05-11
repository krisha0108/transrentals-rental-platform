-- Add pickupAddress column to bike_quote_requests so the customer can
-- supply a full pickup address (defaulted from their profile, editable per booking).

ALTER TABLE `bike_quote_requests`
  ADD COLUMN `pickupAddress` TEXT NULL;
