-- Add fcmToken and lastLoginAt columns to vendor_staff table
-- These columns are needed for driver PWA push notifications and login tracking

ALTER TABLE `vendor_staff` ADD COLUMN IF NOT EXISTS `fcmToken` TEXT NULL;
ALTER TABLE `vendor_staff` ADD COLUMN IF NOT EXISTS `lastLoginAt` DATETIME(3) NULL;

-- Add fcmToken to vendors table if not already present (was added via db push earlier)
ALTER TABLE `vendors` ADD COLUMN IF NOT EXISTS `fcmToken` TEXT NULL;
