-- Add broadcastedAt column to wander_quote_requests.
-- Used for the admin-gatekeeper RFQ flow on admin-listed tours:
-- new requests on admin tours stay invisible to vendors until admin
-- explicitly broadcasts them, at which point this column is set.

ALTER TABLE `wander_quote_requests`
  ADD COLUMN `broadcastedAt` DATETIME(3) NULL;
