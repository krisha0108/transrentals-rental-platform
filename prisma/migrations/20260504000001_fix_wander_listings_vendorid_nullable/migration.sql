-- Fix: make wander_listings.vendorId nullable so admin can create listings without a vendor
-- Root cause: original migration created vendorId as NOT NULL, but schema expects it as optional

-- Step 1: Drop existing FK constraint (was ON DELETE CASCADE, needs to be ON DELETE SET NULL)
-- Idempotent: skip if FK doesn't exist (e.g. when DB was synced via diff before this migration ran)
ALTER TABLE `wander_listings` DROP FOREIGN KEY IF EXISTS `wander_listings_vendorId_fkey`;

-- Step 2: Make vendorId nullable
ALTER TABLE `wander_listings` MODIFY COLUMN `vendorId` VARCHAR(191) NULL;

-- Step 3: Re-add FK constraint with ON DELETE SET NULL
ALTER TABLE `wander_listings`
  ADD CONSTRAINT `wander_listings_vendorId_fkey`
  FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
