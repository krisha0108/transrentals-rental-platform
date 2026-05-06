-- Add createMode column to wander_listings to remember whether
-- a listing was created via the Quick Add flow or the Detailed wizard.
-- Existing rows default to 'DETAILED' since they were all created via the detailed flow.

ALTER TABLE `wander_listings`
  ADD COLUMN `createMode` ENUM('QUICK', 'DETAILED') NOT NULL DEFAULT 'DETAILED';
